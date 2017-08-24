/* global google */
import React, { Component, PropTypes } from "react";
import { Button } from "react-bootstrap";
import { browserHistory } from "react-router";
import LoadingWheel from "../components/LoadingWheel";
import VoterActions from "../actions/VoterActions";
import VoterStore from "../stores/VoterStore";
import BallotStore from "../stores/BallotStore";

export default class AddressBox extends Component {
  static propTypes = {
    _toggleSelectAddressModal: PropTypes.func,
    saveUrl: PropTypes.string.isRequired
  };

  constructor (props) {
      super(props);
      this.state = {
        loading: false,
        text_for_map_search: "",
        ballotCaveat: "",
      };

    this.updateVoterAddress = this.updateVoterAddress.bind(this);
    this.voterAddressSave = this.voterAddressSave.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  componentDidMount () {
    this.setState({
      text_for_map_search: VoterStore.getTextForMapSearch(),
      ballotCaveat: BallotStore.getBallotCaveat()
    });
    this.voterStoreListener = VoterStore.addListener(this._onVoterStoreChange.bind(this));
    this.ballotStoreListener = BallotStore.addListener(this._onBallotStoreChange.bind(this));
    let addressAutocomplete = new google.maps.places.Autocomplete(this.refs.autocomplete);
    addressAutocomplete.setComponentRestrictions({country: "us"});
    this.googleAutocompleteListener = addressAutocomplete.addListener("place_changed", this._placeChanged.bind(this, addressAutocomplete));
  }

  componentWillUnmount (){
    this.voterStoreListener.remove();
    this.ballotStoreListener.remove();
    this.googleAutocompleteListener.remove();
  }

  _onVoterStoreChange () {
    if (this.props._toggleSelectAddressModal){
       this.props._toggleSelectAddressModal();
     }
    if (this.state.text_for_map_search){
      browserHistory.push(this.props.saveUrl);
    } else {
      this.setState({
        text_for_map_search: VoterStore.getTextForMapSearch(),
        loading: false
      });
    }
  }

  _onBallotStoreChange () {
      this.setState({ ballotCaveat: BallotStore.getBallotCaveat() });
  }

  _ballotLoaded (){
    browserHistory.push(this.props.saveUrl);
  }

  _placeChanged (addressAutocomplete) {
    let place = addressAutocomplete.getPlace();
    if (place.formatted_address) {
      this.setState({
        text_for_map_search: place.formatted_address
      });
    } else {
      this.setState({
        text_for_map_search: place.name
      });
    }
  }

  updateVoterAddress (event) {
    this.setState({text_for_map_search: event.target.value});
  }

  handleKeyPress (event) {
    const ENTER_KEY_CODE = 13;
    if (event.keyCode === ENTER_KEY_CODE) {
      event.preventDefault();
      setTimeout(() => {
        VoterActions.voterAddressSave(this.state.text_for_map_search);
        this.setState({loading: true});
      }, 250);
    }
  }

  voterAddressSave (event) {
    event.preventDefault();
    VoterActions.voterAddressSave(this.state.text_for_map_search);
    this.setState({loading: true});
  }

  render () {
    if (this.state.loading){
      return LoadingWheel;
    }
    return <div>
        <form onSubmit={this.voterAddressSave}>
          <input
            type="text"
            value={this.state.text_for_map_search}
            onKeyDown={this.handleKeyPress}
            onChange={this.updateVoterAddress}
            name="address"
            className="form-control"
            ref="autocomplete"
            placeholder="Enter address where you are registered to vote"
            autoFocus
          />
        </form>
        <div>
          <Button
            className="pull-right"
            onClick={this.voterAddressSave}
            bsStyle="primary">
            Save</Button>
        </div>
      <p/><h4>{this.state.ballotCaveat}</h4>
      </div>;
  }
}
