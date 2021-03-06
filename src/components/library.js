import { ipcRenderer } from 'electron';
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import keymapManager from './../keymap-manager';
import Picture from './picture';
import PictureDetail from './picture-detail';
import PictureDiff from './picture-diff';

class Library extends React.Component {
  static propTypes = {
    setScrollTop: React.PropTypes.func.isRequired,
    actions: React.PropTypes.object.isRequired,
    current: React.PropTypes.number,
    diff: React.PropTypes.bool.isRequired,
    photos: React.PropTypes.array.isRequired
  }

  constructor(props) {
    super(props);

    this.moveHighlightRight = this.moveHighlightRight.bind(this);
    this.moveHighlightLeft = this.moveHighlightLeft.bind(this);
    this.moveHighlightUp = this.moveHighlightUp.bind(this);
    this.moveHighlightDown = this.moveHighlightDown.bind(this);
    this.pressedEnter = this.pressedEnter.bind(this);

    this.state = { highlighted: [], scrollTop: 0, modal: 'none' };
  }

  handleCurrent(current) {
    let state = this.state;

    this.props.actions.setCurrent(current);

    if (this.props.current != -1)
      state.scrollTop = this.node.parentNode.scrollTop;

    this.setState(state);
  }

  handleFlagging() {
    let flagSet = this.props.photos
      .filter((photo, i) => this.state.highlighted.indexOf(i) != -1);

    this.props.actions.flagSet(this.props.photos, flagSet, true);
  }

  pressedEnter() {
    if (this.state.highlighted.length == 1)
      this.handleCurrent(this.state.highlighted[0]);
  }

  componentDidUpdate() {
    let state = this.state;

    if (this.props.current == -1 && state.scrollTop > 0) {
      this.props.setScrollTop(state.scrollTop);
      state.scrollTop = 0;
      this.setState(state);
    }
  }

  componentDidMount() {
    this.props.actions.getPhotos();

    window.addEventListener('library:left', this.moveHighlightLeft);
    window.addEventListener('library:right', this.moveHighlightRight);
    window.addEventListener('library:up', this.moveHighlightUp);
    window.addEventListener('library:down', this.moveHighlightDown);
    window.addEventListener('library:enter', this.pressedEnter);

    keymapManager.bind(this.refs.library);
  }

  componentWillUnmount() {
    window.removeEventListener('library:left', this.moveHighlightLeft);
    window.removeEventListener('library:right', this.moveHighlightRight);
    window.removeEventListener('library:up', this.moveHighlightUp);
    window.removeEventListener('library:down', this.moveHighlightDown);
    window.removeEventListener('library:enter', this.pressedEnter);

    keymapManager.unbind();
  }

  isLast() {
    let photos = this.props.photos;

    if (photos.length == photos.indexOf(this.props.current) + 1)
      return true;
    else if (photos.indexOf(this.props.current) == 0)
      return true;
    else
      return false;
  }

  handleFlag() {
    this.props.actions.toggleFlag(this.props.photos[this.props.current]);
  }

  moveHighlightLeft() {
    let state = this.state;
    let currentPos = this.state.highlighted[0];

    if (currentPos-1 >= 0)
      state.highlighted = [currentPos-1];

    this.setState(state);
  }

  moveHighlightRight() {
    let state = this.state;
    let currentPos = this.state.highlighted[0];

    if (currentPos+1 < this.props.photos.length)
      state.highlighted = [currentPos+1];

    this.setState(state);
  }

  moveHighlightUp(e) {
    e.preventDefault();

    let state = this.state;
    let currentPos = this.state.highlighted[0];
    let gridWidth = this.refs.library.getBoundingClientRect().width;
    let elWidth = this.refs.library.children[0].getBoundingClientRect().width;
    let jumpSize = gridWidth / elWidth;

    if (currentPos - jumpSize > 0)
      state.highlighted = [currentPos - jumpSize];

    this.setState(state);
  }

  moveHighlightDown(e) {
    e.preventDefault();

    let state = this.state;
    let currentPos = this.state.highlighted[0];
    let gridWidth = this.refs.library.getBoundingClientRect().width;
    let elWidth = this.refs.library.children[0].getBoundingClientRect().width;
    let jumpSize = gridWidth / elWidth;

    if (currentPos + jumpSize < this.props.photos.length)
      state.highlighted = [currentPos + jumpSize];

    this.setState(state);
  }

  handleHighlight(index, ctrlKey) {
    let state = this.state;

    if (!ctrlKey)
      state.highlighted = [];

    state.highlighted.push(index);

    this.setState(state);
  }

  startScanning() {
    ipcRenderer.send('start-scanning');
  }

  render() {
    let currentView;

    let libraryClass = classNames({ 'grid': this.props.current == -1 });

    if (!this.props.photos || this.props.photos.length === 0)
      currentView = (
        <div>
          <p>
            <span>No photos imported. press Ctrl+R or </span>
            <button 
              id="start-scanning"
              onClick={this.startScanning.bind(this)}>click here</button>
            <span> to start scanning</span>
          </p>
        </div>
      );

    else if (this.props.current == -1)
      currentView = this.props.photos.map((photo, index) => {
        return (
          <Picture
            key={index}
            index={index}
            photo={photo}
            setHighlight={this.handleHighlight.bind(this)}
            highlighted={this.state.highlighted.indexOf(index) != -1}
            setFlagging={this.handleFlagging.bind(this)}
            setCurrent={this.handleCurrent.bind(this)} />
        );
      });

    else if (this.props.diff)
      currentView = <PictureDiff
                      actions={this.props.actions}
                      photo={this.props.photos[this.props.current]} />;

    else
      currentView = <PictureDetail
                      photo={this.props.photos[this.props.current]}
                      actions={this.props.actions}
                      toggleFlag={this.handleFlag.bind(this)}
                      setCurrent={this.handleCurrent.bind(this)}
                      isLast={this.isLast.bind(this)} />;

    return (
      <div id="library" className={libraryClass} ref="library">
        {currentView}
      </div>
    );
  }
}

const ReduxLibrary = connect(state => ({
  photos: state.photos,
  current: state.current,
  diff: state.diff
}))(Library);

export default ReduxLibrary;
