import { ReduceStore } from 'flux/utils';
import OrganizationActions from '../actions/OrganizationActions';
import VoterGuideActions from '../actions/VoterGuideActions';
import Dispatcher from '../common/dispatcher/Dispatcher';
import AppObservableStore from '../common/stores/AppObservableStore';
import apiCalming from '../common/utils/apiCalming';
import VoterConstants from '../constants/VoterConstants';
import VoterStore from './VoterStore';

/* eslint no-param-reassign: 0 */

const explanationOrganizationsVoterIsFollowing = ['organizationLeagueOfWomenVoters', 'organizationOprah', 'organizationSierraClub'];

class OrganizationStore extends ReduceStore {
  getInitialState () {
    return {
      allCachedOrganizationsDict: {}, // This is a dictionary with organizationWeVoteId as key and list of organizations
      allCachedPositionsByOrganization: {}, // This is a dictionary with organizationWeVoteId as key with the list of all positions for the organization as value
      allCachedPositionsByPositionWeVoteId: {}, // This is a dictionary with positionWeVoteId as key with the position for the value
      allCachedPositionsByOrganizationDict: {}, // This is a dictionary with organizationWeVoteId as key and another dictionary with contestWeVoteId as second key
      organizationWeVoteIdsFollowedByOrganizationDict: {}, // Dictionary with organizationWeVoteId as key and list of organizationWeVoteId's being followed as value
      organizationWeVoteIdsFollowingByOrganizationDict: {}, // Dictionary with organizationWeVoteId as key and list of organizationWeVoteId's following that org as value
      organizationWeVoteIdsVoterIsDisliking: [],
      organizationWeVoteIdsVoterIsFollowing: explanationOrganizationsVoterIsFollowing,
      organizationWeVoteIdsVoterIsIgnoring: [],
      organizationWeVoteIdsVoterIsFollowingOnTwitter: [],
      organizationSearchResults: {
        organization_search_term: '',
        organization_twitter_handle: '',
        number_of_search_results: 0,
        organizations_list: [],
      },
      politicianWeVoteIdsVoterIsDisliking: [],
      politicianWeVoteIdsVoterIsFollowing: [],
      voterOrganizationFeaturesProvided: {
        chosenFaviconAllowed: false,
        chosenFeaturePackage: 'FREE',
        chosenFullDomainAllowed: false,
        chosenGoogleAnalyticsAllowed: false,
        chosenSocialShareImageAllowed: false,
        chosenSocialShareDescriptionAllowed: false,
        chosenPromotedOrganizationsAllowed: false,
        featuresProvidedBitmap: 0,
      },
      positionListForOpinionMakerHasBeenRetrievedOnce: {}, // Dictionary with googleCivicElectionId as key and organizationWeVoteId as key and true/false as value
    };
  }

  resetState () {
    return this.getInitialState();
  }

  doesOrganizationHavePositionOnBallotItem (organizationWeVoteId, ballotItemWeVoteId) {
    // console.log('OrganizationStore doesOrganizationHavePositionOnBallotItem:', organizationWeVoteId, ballotItemWeVoteId);
    if (organizationWeVoteId && ballotItemWeVoteId) {
      const { allCachedPositionsByOrganizationDict } = this.getState();
      if (allCachedPositionsByOrganizationDict && allCachedPositionsByOrganizationDict[organizationWeVoteId] && allCachedPositionsByOrganizationDict[organizationWeVoteId][ballotItemWeVoteId]) {
        // console.log('FOUND doesOrganizationHavePositionOnBallotItem ballotItemWeVoteId:', ballotItemWeVoteId);
        return true;
      }
    }
    return false;
  }

  getAllOrganizationPositions (organizationWeVoteId) {
    const { allCachedPositionsByOrganization } = this.getState();
    // console.log('getAllOrganizationPositions, organizationWeVoteId: ', organizationWeVoteId);
    if (allCachedPositionsByOrganization[organizationWeVoteId]) {
      return allCachedPositionsByOrganization[organizationWeVoteId] || [];
    }
    return [];
  }

  getChosenSettingsFlagState (flag) {
    // Look in js/Constants/VoterConstants.js for list of flag constant definitions
    const { voterOrganizationFeaturesProvided } = this.getState();
    if (!voterOrganizationFeaturesProvided || !voterOrganizationFeaturesProvided.featuresProvidedBitmap) {
      return false;
    }
    const featuresProvidedBitmap = voterOrganizationFeaturesProvided.featuresProvidedBitmap || 0;
    // return True if bit specified by the flag is also set
    //  in notificationSettingsFlags (voter.notification_settings_flags)
    // Eg: if interfaceStatusFlags = 5, then we can confirm that bits representing 1 and 4 are set (i.e., 0101)
    // so for value of flag = 1 and 4, we return a positive integer,
    // but, the bit representing 2 and 8 are not set, so for flag = 2 and 8, we return zero
    return featuresProvidedBitmap & flag; // eslint-disable-line no-bitwise
  }

  getChosenFaviconAllowed () {
    // Is this voter/organization allowed to add a custom favicon?
    const { voterOrganizationFeaturesProvided } = this.getState();
    if (!voterOrganizationFeaturesProvided) {
      return false;
    }
    return voterOrganizationFeaturesProvided.chosenFaviconAllowed || false;
  }

  getChosenFeaturePackage () {
    // Is this voter/organization allowed to add a custom full domain?
    const { voterOrganizationFeaturesProvided } = this.getState();
    if (!voterOrganizationFeaturesProvided || !voterOrganizationFeaturesProvided.chosenFeaturePackage) {
      return 'FREE';
    }
    return voterOrganizationFeaturesProvided.chosenFeaturePackage;
  }

  getChosenFullDomainAllowed () {
    // Is this voter/organization allowed to add a custom full domain?
    const { voterOrganizationFeaturesProvided } = this.getState();
    if (!voterOrganizationFeaturesProvided) {
      return false;
    }
    return voterOrganizationFeaturesProvided.chosenFullDomainAllowed || false;
  }

  getChosenGoogleAnalyticsAllowed () {
    // Is this voter/organization allowed to add a custom Google Analytics Code?
    const { voterOrganizationFeaturesProvided } = this.getState();
    if (!voterOrganizationFeaturesProvided) {
      return false;
    }
    return voterOrganizationFeaturesProvided.chosenGoogleAnalyticsAllowed || false;
  }

  getChosenSocialShareImageAllowed () {
    // Is this voter/organization allowed to add custom social sharing images?
    const { voterOrganizationFeaturesProvided } = this.getState();
    if (!voterOrganizationFeaturesProvided) {
      return false;
    }
    return voterOrganizationFeaturesProvided.chosenSocialShareImageAllowed || false;
  }

  getChosenSocialShareDescriptionAllowed () {
    // Is this voter/organization allowed to add a custom description of their site?
    const { voterOrganizationFeaturesProvided } = this.getState();
    if (!voterOrganizationFeaturesProvided) {
      return false;
    }
    return voterOrganizationFeaturesProvided.chosenSocialShareDescriptionAllowed || false;
  }

  getChosenPromotedOrganizationsAllowed () {
    // Is this voter/organization allowed to add or display promoted organizations?
    const { voterOrganizationFeaturesProvided } = this.getState();
    if (!voterOrganizationFeaturesProvided) {
      return false;
    }
    return voterOrganizationFeaturesProvided.chosenPromotedOrganizationsAllowed || false;
  }

  getOrganizationByWeVoteId (organizationWeVoteId) {
    const { allCachedOrganizationsDict } = this.getState();
    return allCachedOrganizationsDict[organizationWeVoteId] || {};
  }

  getOrganizationPositionByWeVoteId (organizationWeVoteId, ballotItemWeVoteId) {
    const { allCachedPositionsByOrganizationDict } = this.getState();
    let requestedPosition = {};
    // console.log('getOrganizationPositionByWeVoteId, organizationWeVoteId: ', organizationWeVoteId, ', ballotItemWeVoteId: ', ballotItemWeVoteId);
    if (allCachedPositionsByOrganizationDict[organizationWeVoteId] && allCachedPositionsByOrganizationDict[organizationWeVoteId][ballotItemWeVoteId]) {
      requestedPosition = allCachedPositionsByOrganizationDict[organizationWeVoteId][ballotItemWeVoteId];
    }
    return requestedPosition;
  }

  getOrganizationWeVoteIdsVoterIsFollowingLength () {
    // console.log('OrganizationStore.getOrganizationWeVoteIdsVoterIsFollowingLength, organizationWeVoteIdsVoterIsFollowing: ', this.getState().organizationWeVoteIdsVoterIsFollowing);
    if (this.getState().organizationWeVoteIdsVoterIsFollowing) {
      return this.getState().organizationWeVoteIdsVoterIsFollowing.length;
    }
    return 0;
  }

  getOrganizationsVoterIsDisliking () {
    // console.log('OrganizationStore.getOrganizationsVoterIsDisliking, organizationWeVoteIdsVoterIsDisliking: ', this.getState().organizationWeVoteIdsVoterIsDisliking);
    return this.returnOrganizationsFromListOfIds(this.getState().organizationWeVoteIdsVoterIsDisliking) || [];
  }

  getOrganizationsVoterIsFollowing () {
    // console.log('OrganizationStore.getOrganizationsVoterIsFollowing, organizationWeVoteIdsVoterIsFollowing: ', this.getState().organizationWeVoteIdsVoterIsFollowing);
    return this.returnOrganizationsFromListOfIds(this.getState().organizationWeVoteIdsVoterIsFollowing) || [];
  }

  getOrganizationsFollowedByVoterOnTwitter () {
    return this.returnOrganizationsFromListOfIds(this.getState().organizationWeVoteIdsVoterIsFollowingOnTwitter) || [];
  }

  getOrganizationSearchResultsList () {
    // if only one organization is found, return the organization_twitter_handle
    const { organizationSearchResults } = this.getState();
    if (organizationSearchResults && organizationSearchResults.organizations_list && organizationSearchResults.number_of_search_results > 0) {
      return organizationSearchResults.organizations_list || [];
    }
    return [];
  }

  getOrganizationSearchResultsOrganization () {
    // if only one organization is found, return the organization_twitter_handle
    const { organizationSearchResults } = this.getState();
    const numberOfSearchResults = organizationSearchResults.number_of_search_results || 0;
    if (numberOfSearchResults === 1) {
      const organizationList = organizationSearchResults.organizations_list;
      return organizationList[0];
    }
    return {};
  }

  getOrganizationSearchResultsOrganizationName () {
    const organization = this.getOrganizationSearchResultsOrganization();
    if (organization && organization.organization_name) {
      return organization.organization_name;
    }
    return '';
  }

  getOrganizationSearchResultsTwitterHandle () {
    const organization = this.getOrganizationSearchResultsOrganization();
    if (organization && organization.organization_twitter_handle) {
      return organization.organization_twitter_handle;
    }
    return '';
  }

  getOrganizationSearchResultsWebsite () {
    const organization = this.getOrganizationSearchResultsOrganization();
    if (organization && organization.organization_website) {
      return organization.organization_website;
    }
    return '';
  }

  getPositionByPositionWeVoteId (positionWeVoteId) {
    const { allCachedPositionsByPositionWeVoteId } = this.getState();
    return allCachedPositionsByPositionWeVoteId[positionWeVoteId] || {};
  }

  isVoterDislikingThisOrganization (organizationWeVoteId) {
    const { organizationWeVoteIdsVoterIsDisliking } = this.getState();
    // console.log('OrganizationStore, isVoterDislikingThisOrganization, organizationWeVoteIdsVoterIsDisliking: ', organizationWeVoteIdsVoterIsDisliking);
    if (organizationWeVoteIdsVoterIsDisliking.length) {
      return organizationWeVoteIdsVoterIsDisliking.includes(organizationWeVoteId);
      // const isDisliking = organizationWeVoteIdsVoterIsDisliking.includes(organizationWeVoteId);
      // console.log('OrganizationStore, isVoterDislikingThisOrganization:', isDisliking, ', organizationWeVoteId:', organizationWeVoteId);
      // return isDisliking;
    } else {
      // console.log('OrganizationStore, isVoterDislikingThisOrganization: NO organizationWeVoteIdsVoterIsDisliking, organizationWeVoteId: ', organizationWeVoteId);
      return false;
    }
  }

  isVoterDislikingThisPolitician (politicianWeVoteId) {
    const { politicianWeVoteIdsVoterIsDisliking } = this.getState();
    // console.log('OrganizationStore, isVoterDislikingThisPolitician, politicianWeVoteIdsVoterIsDisliking: ', politicianWeVoteIdsVoterIsDisliking);
    if (politicianWeVoteIdsVoterIsDisliking.length) {
      return politicianWeVoteIdsVoterIsDisliking.includes(politicianWeVoteId);
      // const isDisliking = politicianWeVoteIdsVoterIsDisliking.includes(politicianWeVoteId);
      // console.log('OrganizationStore, isVoterDislikingThisPolitician:', isDisliking, ', politicianWeVoteId:', politicianWeVoteId);
      // return isDisliking;
    } else {
      // console.log('OrganizationStore, isVoterDislikingThisPolitician: NO politicianWeVoteIdsVoterIsDisliking, politicianWeVoteId: ', politicianWeVoteId);
      return false;
    }
  }

  isVoterFollowingThisOrganization (organizationWeVoteId) {
    const { organizationWeVoteIdsVoterIsFollowing } = this.getState();
    // console.log('OrganizationStore, isVoterFollowingThisOrganization, organizationWeVoteIdsVoterIsFollowing: ', organizationWeVoteIdsVoterIsFollowing);
    if (organizationWeVoteIdsVoterIsFollowing.length) {
      return organizationWeVoteIdsVoterIsFollowing.includes(organizationWeVoteId);
      // const isFollowing = organizationWeVoteIdsVoterIsFollowing.includes(organizationWeVoteId);
      // console.log('OrganizationStore, isVoterFollowingThisOrganization:', isFollowing, ', organizationWeVoteId:', organizationWeVoteId);
      // return isFollowing;
    } else {
      // console.log('OrganizationStore, isVoterFollowingThisOrganization: NO organizationWeVoteIdsVoterIsFollowing, organizationWeVoteId: ', organizationWeVoteId);
      return false;
    }
  }

  isVoterFollowingThisPolitician (politicianWeVoteId) {
    const { politicianWeVoteIdsVoterIsFollowing } = this.getState();
    // console.log('OrganizationStore, isVoterFollowingThisPolitician, politicianWeVoteIdsVoterIsFollowing: ', politicianWeVoteIdsVoterIsFollowing);
    if (politicianWeVoteIdsVoterIsFollowing.length) {
      return politicianWeVoteIdsVoterIsFollowing.includes(politicianWeVoteId);
      // const isFollowing = politicianWeVoteIdsVoterIsFollowing.includes(politicianWeVoteId);
      // console.log('OrganizationStore, isVoterFollowingThisPolitician:', isFollowing, ', politicianWeVoteId:', politicianWeVoteId);
      // return isFollowing;
    } else {
      // console.log('OrganizationStore, isVoterFollowingThisPolitician: NO politicianWeVoteIdsVoterIsFollowing, politicianWeVoteId: ', politicianWeVoteId);
      return false;
    }
  }


  isVoterIgnoringThisOrganization (organizationWeVoteId) {
    const { organizationWeVoteIdsVoterIsIgnoring } = this.getState();
    // console.log('OrganizationStore, isVoterIgnoringThisOrganization, organizationWeVoteIdsVoterIsIgnoring: ', organizationWeVoteIdsVoterIsIgnoring);
    if (organizationWeVoteIdsVoterIsIgnoring.length) {
      return organizationWeVoteIdsVoterIsIgnoring.includes(organizationWeVoteId);
      // const isIgnoring = organizationWeVoteIdsVoterIsIgnoring.includes(organizationWeVoteId);
      // console.log('OrganizationStore, isVoterIgnoringThisOrganization:', isIgnoring, ', organizationWeVoteId:', organizationWeVoteId);
      // return isIgnoring;
    } else {
      // console.log('OrganizationStore, isVoterIgnoringThisOrganization: NO organizationWeVoteIdsVoterIsIgnoring, org_we_vote_id: ', organizationWeVoteId);
      return false;
    }
  }

  _copyListsToNewOrganization (newOrganization, priorCopyOfOrganization) { // eslint-disable-line
    // console.log('newOrganization (_copyListsToNewOrganization): ', newOrganization);
    // console.log('priorCopyOfOrganization (_copyListsToNewOrganization): ', priorCopyOfOrganization);
    newOrganization.friends_position_list_for_one_election = priorCopyOfOrganization.friends_position_list_for_one_election;
    newOrganization.friends_position_list_for_all_except_one_election = priorCopyOfOrganization.friends_position_list_for_all_except_one_election;
    newOrganization.friends_position_list = priorCopyOfOrganization.friends_position_list;
    // The following line was removed because it prevented the rendering of an organization's banner. Issue #1582
    // newOrganization.organization_banner_url = priorCopyOfOrganization.organization_banner_url;
    newOrganization.position_list_for_one_election = priorCopyOfOrganization.position_list_for_one_election;
    newOrganization.position_list_for_all_except_one_election = priorCopyOfOrganization.position_list_for_all_except_one_election;
    newOrganization.position_list = priorCopyOfOrganization.position_list;
    return newOrganization;
  }

  positionListForOpinionMakerHasBeenRetrievedOnce (googleCivicElectionId, organizationWeVoteId) {
    if (!googleCivicElectionId || googleCivicElectionId === 0 || googleCivicElectionId === '0') {
      googleCivicElectionId = 0;
    }
    if (organizationWeVoteId) {
      if (this.getState().positionListForOpinionMakerHasBeenRetrievedOnce[googleCivicElectionId]) {
        return this.getState().positionListForOpinionMakerHasBeenRetrievedOnce[googleCivicElectionId][organizationWeVoteId] || false;
      }
    }
    return false;
  }

  // Given a list of ids, retrieve the complete allCachedOrganizationsDict with all attributes and return as array
  returnOrganizationsFromListOfIds (listOfOrganizationWeVoteIds) {
    const state = this.getState();
    const filteredOrganizations = [];
    if (listOfOrganizationWeVoteIds) {
      // organizationsFollowedRetrieve API returns more than one voter guide per organization sometimes.
      const uniqueOrganizationWeVoteIdArray = listOfOrganizationWeVoteIds.filter((value, index, self) => self.indexOf(value) === index);
      uniqueOrganizationWeVoteIdArray.forEach((organizationWeVoteId) => {
        if (state.allCachedOrganizationsDict[organizationWeVoteId]) {
          filteredOrganizations.push(state.allCachedOrganizationsDict[organizationWeVoteId]);
        }
      });
    }
    return filteredOrganizations;
  }

  modifyPositionObject (positionItem, setInformationOnlyFalse = false, setInformationOnlyTrue = false, setOpposeFalse = false, setOpposeTrue = false, setSupportFalse = false, setSupportTrue = false) {
    if (!positionItem) {
      return {};
    }
    if (setInformationOnlyFalse) {
      positionItem.is_information_only = false;
    }
    if (setInformationOnlyTrue) {
      positionItem.is_information_only = true;
    }
    if (setOpposeFalse) {
      positionItem.is_oppose = false;
      positionItem.is_oppose_or_negative_rating = false;
    }
    if (setOpposeTrue) {
      positionItem.is_oppose = true;
      positionItem.is_oppose_or_negative_rating = true;
    }
    if (setSupportFalse) {
      positionItem.is_support = false;
      positionItem.is_support_or_positive_rating = false;
    }
    if (setSupportTrue) {
      positionItem.is_support = true;
      positionItem.is_support_or_positive_rating = true;
    }
    return positionItem;
  }

  reduce (state, action) {
    // Note: We deal with errors (!action.res.success) on an API-by-API basis.
    if (!action.res) {
      console.log('OrganizationStore ', action.type, ' FAILED, no action.res');
      return state;
    }
    const {
      allCachedOrganizationsDict, allCachedPositionsByOrganization, allCachedPositionsByOrganizationDict,
      allCachedPositionsByPositionWeVoteId,
      organizationWeVoteIdsFollowedByOrganizationDict, organizationWeVoteIdsFollowingByOrganizationDict,
      politicianWeVoteIdsVoterIsDisliking, politicianWeVoteIdsVoterIsFollowing,
    } = state;
    let {
      organizationWeVoteIdsVoterIsDisliking, organizationWeVoteIdsVoterIsFollowing, organizationWeVoteIdsVoterIsIgnoring,
    } = state;
    const allCachedPositionsForOneOrganization = [];
    let ballotItemWeVoteId;
    let chosenFeaturePackage;
    let existingPosition;
    let featuresProvidedBitmap;
    let googleCivicElectionId;
    let hostname;
    let isPublicPosition;
    let issueList;
    let mergedPosition = {};
    let modifiedPosition;
    let modifiedPositionChangeFound = false;
    let newPositionList;
    let numberOfSearchResults = 0;
    let organizationWeVoteId;
    let organization;
    let organizationDislikedList = [];
    let organizationList = [];
    let organizationsFollowedOnTwitterList;
    let politicianWeVoteId;
    let positionWeVoteId;
    let priorCopyOfOrganization;
    let revisedOrganization;
    let revisedState;
    let statementText;
    let voterGuides;
    let voterLinkedOrganizationWeVoteId;
    let voterOrganizationFeaturesProvided;
    const organizationWeVoteIdForVoterGuideOwner = action.res.organization_we_vote_id;

    switch (action.type) {
      case 'issueDescriptionsRetrieve':
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        issueList = action.res.issue_list;
        revisedState = state;

        // console.log('OrganizationStore issueDescriptionsRetrieve issueList:', issueList);
        issueList.forEach((issue) => {
          if (issue.linked_organization_preview_list) {
            issue.linked_organization_preview_list.forEach((linkedOrganizationPreview) => {
              if (linkedOrganizationPreview.organization_we_vote_id) {
                if (allCachedOrganizationsDict[linkedOrganizationPreview.organization_we_vote_id]) {
                  // If there is already an organization stored, don't overwrite
                } else {
                  // Save this bit of organization data
                  linkedOrganizationPreview.organization_photo_url_medium = linkedOrganizationPreview.we_vote_hosted_profile_image_url_medium;
                  linkedOrganizationPreview.organization_photo_url_tiny = linkedOrganizationPreview.we_vote_hosted_profile_image_url_tiny;
                  allCachedOrganizationsDict[linkedOrganizationPreview.organization_we_vote_id] = linkedOrganizationPreview;
                }
              }
            });
          }
        });
        // console.log('allCachedOrganizationsDict:', allCachedOrganizationsDict);
        revisedState = { ...revisedState,
          allCachedOrganizationsDict,
        };
        return revisedState;

      case 'issueOrganizationsRetrieve':
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        organizationList = action.res.organization_list;
        // console.log('OrganizationStore issueOrganizationsRetrieve organizationList:', organizationList);
        revisedState = state;

        organizationList.forEach((linkedOrganizationPreview) => {
          if (linkedOrganizationPreview.organization_we_vote_id) {
            if (allCachedOrganizationsDict[linkedOrganizationPreview.organization_we_vote_id]) {
              // If there is already an organization stored, don't overwrite
            } else {
              // Save this bit of organization data
              linkedOrganizationPreview.organization_photo_url_medium = linkedOrganizationPreview.we_vote_hosted_profile_image_url_medium;
              linkedOrganizationPreview.organization_photo_url_tiny = linkedOrganizationPreview.we_vote_hosted_profile_image_url_tiny;
              allCachedOrganizationsDict[linkedOrganizationPreview.organization_we_vote_id] = linkedOrganizationPreview;
            }
          }
        });
        // console.log('OrganizationStore issueOrganizationsRetrieve allCachedOrganizationsDict:', allCachedOrganizationsDict);
        revisedState = {
          ...revisedState,
          allCachedOrganizationsDict,
        };
        return revisedState;

      case 'organizationDislike':
        // organizationWeVoteId is the organization that was just followed
        organizationWeVoteId = action.res.organization_we_vote_id;
        politicianWeVoteId = action.res.politician_we_vote_id;
        if (!organizationWeVoteId || !action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        if (apiCalming('organizationsFollowedRetrieve', 1000)) {
          OrganizationActions.organizationsFollowedRetrieve();  // Retrieves both Followed and Disliked
        }
        if (!organizationWeVoteIdsVoterIsDisliking.includes(organizationWeVoteId)) {
          organizationWeVoteIdsVoterIsDisliking.push(organizationWeVoteId);
        }
        revisedState = {
          ...state,
          organizationWeVoteIdsVoterIsDisliking,
          organizationWeVoteIdsVoterIsFollowing: organizationWeVoteIdsVoterIsFollowing.filter(
            (existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId,
          ),
          organizationWeVoteIdsVoterIsIgnoring: organizationWeVoteIdsVoterIsIgnoring.filter(
            (existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId,
          ),
        };
        if (politicianWeVoteId) {
          if (!politicianWeVoteIdsVoterIsDisliking.includes(politicianWeVoteId)) {
            politicianWeVoteIdsVoterIsDisliking.push(politicianWeVoteId);
          }
          revisedState = {
            ...revisedState,
            politicianWeVoteIdsVoterIsDisliking,
            politicianWeVoteIdsVoterIsFollowing: politicianWeVoteIdsVoterIsFollowing.filter(
              (existingPoliticianWeVoteId) => existingPoliticianWeVoteId !== politicianWeVoteId,
            ),
          };
        }
        return revisedState;

      case 'organizationFollow':
        // We also listen to 'organizationFollow' in VoterGuideStore, so we can alter organization_we_vote_ids_to_follow_all and organization_we_vote_ids_to_follow_for_latest_ballot_item
        // voterLinkedOrganizationWeVoteId is the voter who clicked the Follow button
        voterLinkedOrganizationWeVoteId = action.res.voter_linked_organization_we_vote_id;
        // organizationWeVoteId is the organization that was just followed
        organizationWeVoteId = action.res.organization_we_vote_id;
        if (!organizationWeVoteId || !action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        politicianWeVoteId = action.res.politician_we_vote_id;
        if (action.res.organization_follow_based_on_issue) {
          // DALE 2019-12-26 Testing without this
          // VoterGuideActions.voterGuidesToFollowRetrieveByIssuesFollowed(); // Whenever a voter follows a new org, update list
        } else {
          // search_string = "";
          // add_voterGuides_not_from_election = false;
          // Whenever a voter follows a new org, update list
          // VoterGuideActions.voterGuidesToFollowRetrieve(VoterStore.electionId(), search_string, add_voterGuides_not_from_election);  // DEBUG=1
        }
        // Update "who I am following" for the voter: voterLinkedOrganizationWeVoteId
        VoterGuideActions.voterGuidesFollowedByOrganizationRetrieve(voterLinkedOrganizationWeVoteId);
        // Update who the organization is followed by
        // 2018-05-02 NOT calling this for optimization (not critical)
        // VoterGuideActions.voterGuidesFollowedByOrganizationRetrieve(organizationWeVoteId);
        // 2018-05-02 NOT calling this for optimization (not critical)
        // VoterGuideActions.voterGuidesRecommendedByOrganizationRetrieve(organizationWeVoteId, VoterStore.electionId());
        // Update the guides the voter is following
        // 2018-05-02 NOT calling this for optimization (not critical)
        // VoterGuideActions.voterGuidesFollowedRetrieve();
        // Update the followers of the organization that was just followed: organizationWeVoteId
        // 2018-05-02 NOT calling this for optimization (not critical)
        // VoterGuideActions.voterGuideFollowersRetrieve(organizationWeVoteId);
        // Retrieve the organizations followed by voter
        if (apiCalming('organizationsFollowedRetrieve', 1000)) {
          OrganizationActions.organizationsFollowedRetrieve();
        }
        if (!organizationWeVoteIdsVoterIsFollowing.includes(organizationWeVoteId)) {
          organizationWeVoteIdsVoterIsFollowing.push(organizationWeVoteId);
        }
        if (!politicianWeVoteIdsVoterIsFollowing.includes(politicianWeVoteId)) {
          politicianWeVoteIdsVoterIsFollowing.push(politicianWeVoteId);
        }
        revisedState = {
          ...state,
          organizationWeVoteIdsVoterIsDisliking: state.organizationWeVoteIdsVoterIsDisliking.filter(
            (existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId,
          ),
          organizationWeVoteIdsVoterIsFollowing,
          organizationWeVoteIdsVoterIsIgnoring: state.organizationWeVoteIdsVoterIsIgnoring.filter(
            (existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId,
          ),
        };
        if (politicianWeVoteId) {
          revisedState = {
            ...revisedState,
            politicianWeVoteIdsVoterIsFollowing,
            politicianWeVoteIdsVoterIsDisliking: state.politicianWeVoteIdsVoterIsDisliking.filter(
              (existingPoliticianWeVoteId) => existingPoliticianWeVoteId !== politicianWeVoteId,
            ),
          };
        }
        return revisedState;

      case 'organizationFollowIgnore':
        // We also listen to "organizationFollowIgnore" in VoterGuideStore so we can alter organization_we_vote_ids_to_follow_all and organization_we_vote_ids_to_follow_for_latest_ballot_item

        // voterLinkedOrganizationWeVoteId is the voter who clicked the Follow button
        // voterLinkedOrganizationWeVoteId = action.res.voter_linked_organization_we_vote_id;
        // organizationWeVoteId is the organization that was just followed
        organizationWeVoteId = action.res.organization_we_vote_id;
        politicianWeVoteId = action.res.politician_we_vote_id;
        if (!organizationWeVoteId || !action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        // Retrieve the organizations followed by voter
        if (apiCalming('organizationsFollowedRetrieve', 1000)) {
          OrganizationActions.organizationsFollowedRetrieve();
        }
        if (!organizationWeVoteIdsVoterIsIgnoring.includes(organizationWeVoteId)) {
          organizationWeVoteIdsVoterIsIgnoring.push(organizationWeVoteId);
        }
        revisedState = {
          ...state,
          organizationWeVoteIdsVoterIsDisliking: organizationWeVoteIdsVoterIsDisliking.filter(
            (existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId,
          ),
          organizationWeVoteIdsVoterIsIgnoring,
          organizationWeVoteIdsVoterIsFollowing: organizationWeVoteIdsVoterIsFollowing.filter(
            (existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId,
          ),
        };
        if (politicianWeVoteId) {
          revisedState = {
            ...revisedState,
            politicianWeVoteIdsVoterIsDisliking: politicianWeVoteIdsVoterIsDisliking.filter(
              (existingPoliticianWeVoteId) => existingPoliticianWeVoteId !== politicianWeVoteId,
            ),
            politicianWeVoteIdsVoterIsFollowing: politicianWeVoteIdsVoterIsFollowing.filter(
              (existingPoliticianWeVoteId) => existingPoliticianWeVoteId !== politicianWeVoteId,
            ),
          };
        }
        return revisedState;

      case 'organizationPhotosSave':
        ({ organization_we_vote_id: organizationWeVoteId } = action.res);
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        ({ hostname } = window.location);
        // console.log('OrganizationStore organizationPhotosSave hostname:', hostname, ', organizationWeVoteId:', organizationWeVoteId);
        AppObservableStore.siteConfigurationRetrieve(hostname, VoterStore.getExternalVoterId());
        if (organizationWeVoteId) {
          OrganizationActions.organizationRetrieve(organizationWeVoteId);
        }
        return state;

      case 'organizationRetrieve':
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        ({ organization_we_vote_id: organizationWeVoteId } = action.res);
        if (!organizationWeVoteId || organizationWeVoteId === '') {
          return state;
        }
        organization = action.res;
        revisedState = state;

        // Make sure to maintain the lists we attach to the organization from other API calls
        if (allCachedOrganizationsDict[organizationWeVoteId]) {
          priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
          organization = this._copyListsToNewOrganization(organization, priorCopyOfOrganization);
        }
        allCachedOrganizationsDict[organizationWeVoteId] = organization;
        revisedState = { ...revisedState, allCachedOrganizationsDict };
        // console.log('allCachedOrganizationsDict:', allCachedOrganizationsDict);
        voterLinkedOrganizationWeVoteId = VoterStore.getLinkedOrganizationWeVoteId();
        if (organizationWeVoteId === voterLinkedOrganizationWeVoteId) {
          ({ features_provided_bitmap: featuresProvidedBitmap, chosen_feature_package: chosenFeaturePackage } = organization);
          voterOrganizationFeaturesProvided = {
            chosenFaviconAllowed: this.getChosenSettingsFlagState(VoterConstants.CHOSEN_FAVICON_ALLOWED),
            chosenFeaturePackage,
            chosenFullDomainAllowed: this.getChosenSettingsFlagState(VoterConstants.CHOSEN_FULL_DOMAIN_ALLOWED),
            chosenGoogleAnalyticsAllowed: this.getChosenSettingsFlagState(VoterConstants.CHOSEN_GOOGLE_ANALYTICS_ALLOWED),
            chosenSocialShareImageAllowed: this.getChosenSettingsFlagState(VoterConstants.CHOSEN_SOCIAL_SHARE_IMAGE_ALLOWED),
            chosenSocialShareDescriptionAllowed: this.getChosenSettingsFlagState(VoterConstants.CHOSEN_SOCIAL_SHARE_DESCRIPTION_ALLOWED),
            chosenPromotedOrganizationsAllowed: this.getChosenSettingsFlagState(VoterConstants.CHOSEN_PROMOTED_ORGANIZATIONS_ALLOWED),
            featuresProvidedBitmap,
          };
          revisedState = { ...revisedState, voterOrganizationFeaturesProvided };
        }
        return revisedState;

      // After an organization is created, return it
      case 'organizationSave':
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        organizationWeVoteId = action.res.organization_we_vote_id;
        organization = action.res;
        // Make sure to maintain the lists we attach to the organization from other API calls
        if (allCachedOrganizationsDict[organizationWeVoteId]) {
          priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
          organization = this._copyListsToNewOrganization(organization, priorCopyOfOrganization);
        }
        allCachedOrganizationsDict[organizationWeVoteId] = organization;
        // Now request fresh siteConfiguration data if the siteOwner was updated
        ({ hostname } = window.location);
        hostname = hostname || '';
        // console.log('OrganizationStore organizationPhotosSave hostname:', hostname, ', organizationWeVoteId:', organizationWeVoteId);
        AppObservableStore.siteConfigurationRetrieve(hostname, VoterStore.getExternalVoterId());
        return {
          ...state,
          allCachedOrganizationsDict,
        };

      case 'organizationSearch':
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        organizationList = action.res.organizations_list || [];
        numberOfSearchResults = organizationList.length;
        return {
          ...state,
          organizationSearchResults: {
            organization_search_term: action.res.organization_search_term,
            organization_twitter_handle: action.res.organization_twitter_handle,
            number_of_search_results: numberOfSearchResults,
            organizations_list: organizationList,
          },
        };

      case 'organizationsFollowedRetrieve':
        // console.log('OrganizationStore organizationsFollowedRetrieve, action.res: ', action.res);
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        if (action.res.auto_followed_from_twitter_suggestion) {
          organizationsFollowedOnTwitterList = action.res.organization_list;
          const organizationWeVoteIdsVoterIsFollowingOnTwitter = [];
          organizationsFollowedOnTwitterList.forEach((oneOrganization) => {
            allCachedOrganizationsDict[organization.organization_we_vote_id] = oneOrganization;
            organizationWeVoteIdsVoterIsFollowingOnTwitter.push(oneOrganization.organization_we_vote_id);
          });
          return {
            ...state,
            organizationWeVoteIdsVoterIsFollowingOnTwitter,
            allCachedOrganizationsDict,
          };
        }
        // If not auto_followed_from_twitter_suggestion, continue with organizations voter is Following.
        organizationList = action.res.organization_list;
        organizationWeVoteIdsVoterIsFollowing = [...explanationOrganizationsVoterIsFollowing]; // Refresh this variable
        organizationList.forEach((oneOrganization) => {
          organizationWeVoteId = oneOrganization.organization_we_vote_id;
          politicianWeVoteId = oneOrganization.politician_we_vote_id;
          // Make sure to maintain the lists we attach to the organization from other API calls
          if (allCachedOrganizationsDict[organizationWeVoteId]) {
            priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
            revisedOrganization = this._copyListsToNewOrganization(oneOrganization, priorCopyOfOrganization);
            allCachedOrganizationsDict[organizationWeVoteId] = revisedOrganization;
          } else {
            allCachedOrganizationsDict[organizationWeVoteId] = oneOrganization;
          }
          if (!organizationWeVoteIdsVoterIsFollowing.includes(organizationWeVoteId)) {
            organizationWeVoteIdsVoterIsFollowing.push(organizationWeVoteId);
          }
          if (politicianWeVoteId) {
            if (!politicianWeVoteIdsVoterIsFollowing.includes(politicianWeVoteId)) {
              politicianWeVoteIdsVoterIsFollowing.push(politicianWeVoteId);
            }
          }
        });
        // Now bring in the disliked organizations
        organizationDislikedList = action.res.organization_disliked_list;
        organizationWeVoteIdsVoterIsDisliking = []; // Refresh this variable
        organizationDislikedList.forEach((oneOrganization) => {
          organizationWeVoteId = oneOrganization.organization_we_vote_id;
          politicianWeVoteId = oneOrganization.politician_we_vote_id;
          // Make sure to maintain the lists we attach to the organization from other API calls
          if (allCachedOrganizationsDict[organizationWeVoteId]) {
            priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
            revisedOrganization = this._copyListsToNewOrganization(oneOrganization, priorCopyOfOrganization);
            allCachedOrganizationsDict[organizationWeVoteId] = revisedOrganization;
          } else {
            allCachedOrganizationsDict[organizationWeVoteId] = oneOrganization;
          }
          if (!organizationWeVoteIdsVoterIsDisliking.includes(organizationWeVoteId)) {
            organizationWeVoteIdsVoterIsDisliking.push(organizationWeVoteId);
          }
          if (politicianWeVoteId) {
            if (!politicianWeVoteIdsVoterIsDisliking.includes(politicianWeVoteId)) {
              politicianWeVoteIdsVoterIsDisliking.push(politicianWeVoteId);
            }
          }
        });
        // console.log('allCachedOrganizationsDict:', allCachedOrganizationsDict);
        return {
          ...state,
          allCachedOrganizationsDict,
          organizationWeVoteIdsVoterIsDisliking,
          organizationWeVoteIdsVoterIsFollowing,
          politicianWeVoteIdsVoterIsDisliking,
          politicianWeVoteIdsVoterIsFollowing,
        };

      case 'organizationStopDisliking':
        // organizationWeVoteId is the organization that was just followed
        organizationWeVoteId = action.res.organization_we_vote_id;
        politicianWeVoteId = action.res.politician_we_vote_id;
        if (!organizationWeVoteId || !action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        if (apiCalming('organizationsFollowedRetrieve', 1000)) {
          OrganizationActions.organizationsFollowedRetrieve();
        }
        revisedState = {
          ...state,
          organizationWeVoteIdsVoterIsDisliking: organizationWeVoteIdsVoterIsDisliking.filter((existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId),
          organizationWeVoteIdsVoterIsFollowing: organizationWeVoteIdsVoterIsFollowing.filter((existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId),
        };
        if (politicianWeVoteId) {
          revisedState = {
            ...revisedState,
            politicianWeVoteIdsVoterIsDisliking: politicianWeVoteIdsVoterIsDisliking.filter((existingPoliticianWeVoteId) => existingPoliticianWeVoteId !== politicianWeVoteId),
            politicianWeVoteIdsVoterIsFollowing: politicianWeVoteIdsVoterIsFollowing.filter((existingPoliticianWeVoteId) => existingPoliticianWeVoteId !== politicianWeVoteId),
          };
        }
        return revisedState;

      case 'organizationStopFollowing':
        // We also listen to "organizationStopFollowing" in VoterGuideStore, so we can alter organization_we_vote_ids_to_follow_all

        // organizationWeVoteId is the organization that was just followed
        organizationWeVoteId = action.res.organization_we_vote_id;
        politicianWeVoteId = action.res.politician_we_vote_id;
        if (!organizationWeVoteId || !action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        if (apiCalming('voterGuidesFollowedRetrieve', 1000)) {
          VoterGuideActions.voterGuidesFollowedRetrieve();
        }
        // Retrieve the organizations followed by voter
        if (apiCalming('organizationsFollowedRetrieve', 1000)) {
          OrganizationActions.organizationsFollowedRetrieve();
        }
        revisedState = {
          ...state,
          organizationWeVoteIdsVoterIsDisliking: organizationWeVoteIdsVoterIsDisliking.filter((existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId),
          organizationWeVoteIdsVoterIsFollowing: organizationWeVoteIdsVoterIsFollowing.filter((existingOrgWeVoteId) => existingOrgWeVoteId !== organizationWeVoteId),
        };
        if (politicianWeVoteId) {
          revisedState = {
            ...revisedState,
            politicianWeVoteIdsVoterIsDisliking: politicianWeVoteIdsVoterIsDisliking.filter((existingPoliticianWeVoteId) => existingPoliticianWeVoteId !== politicianWeVoteId),
            politicianWeVoteIdsVoterIsFollowing: politicianWeVoteIdsVoterIsFollowing.filter((existingPoliticianWeVoteId) => existingPoliticianWeVoteId !== politicianWeVoteId),
          };
        }
        return revisedState;

      case 'positionListForBallotItem':
      case 'positionListForBallotItemFromFriends':
        // console.log('OrganizationStore action.res:', action.res);
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        if (action.res.count === 0) return state;

        newPositionList = action.res.position_list;
        if (newPositionList) {
          newPositionList.forEach((onePosition) => {
            mergedPosition = {
              ...allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id],
              ...onePosition,
            };
            allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id] = mergedPosition;
            // console.log('positionListForBallotItem, ', action.type, ' onePosition:', onePosition);
          });
        }

        return {
          ...state,
          allCachedPositionsByPositionWeVoteId,
        };

      case 'positionListForOpinionMaker': // ...and positionListForOpinionMakerForFriends
        // console.log('OrganizationStore, positionListForOpinionMaker response:', action.res);
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        // TODO: position_list *might* include positions from multiple elections
        organizationWeVoteId = action.res.opinion_maker_we_vote_id;
        googleCivicElectionId = action.res.google_civic_election_id;
        // console.log('START OF positionListForOpinionMaker, allCachedPositionsByPositionWeVoteId:', allCachedPositionsByPositionWeVoteId);
        if (action.res.friends_vs_public === 'FRIENDS_ONLY') { // positionListForOpinionMakerForFriends
          // console.log('positionListForOpinionMaker FRIENDS_ONLY');
          if (action.res.filter_for_voter) {
            // console.log('positionListForOpinionMaker filter_for_voter true?: ', action.res.filter_for_voter);
            const friendsPositionListForOneElection = action.res.position_list;
            if (friendsPositionListForOneElection) {
              friendsPositionListForOneElection.forEach((onePosition) => {
                mergedPosition = {
                  ...allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id],
                  ...onePosition,
                };
                allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id] = mergedPosition;
                // console.log(action.type, ' FRIENDS_ONLY filter_for_voter: True onePosition:', onePosition);
              });
            }
            organization = allCachedOrganizationsDict[organizationWeVoteId] || {};

            // Make sure to maintain the lists we attach to the organization from other API calls
            if (allCachedOrganizationsDict[organizationWeVoteId]) {
              priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
              organization = this._copyListsToNewOrganization(organization, priorCopyOfOrganization);
            }
            // And now update the friendsPositionListForOneElection
            organization.friends_position_list_for_one_election = friendsPositionListForOneElection;
            // console.log('organization-FRIENDS_ONLY-filter_for_voter: ', organization);
            allCachedOrganizationsDict[organizationWeVoteId] = organization;
            return {
              ...state,
              allCachedOrganizationsDict,
              allCachedPositionsByPositionWeVoteId,
            };
          } else if (action.res.filter_out_voter) {
            // console.log('positionListForOpinionMaker filter_out_voter true?: ', action.res.filter_out_voter);
            const friendsPositionListForAllExceptOneElection = action.res.position_list;
            if (friendsPositionListForAllExceptOneElection) {
              friendsPositionListForAllExceptOneElection.forEach((onePosition) => {
                mergedPosition = {
                  ...allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id],
                  ...onePosition,
                };
                allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id] = mergedPosition;
                // console.log(action.type, ' FRIENDS_ONLY filter_out_voter: True onePosition:', onePosition);
              });
            }
            organization = allCachedOrganizationsDict[organizationWeVoteId] || {};

            // Make sure to maintain the lists we attach to the organization from other API calls
            if (allCachedOrganizationsDict[organizationWeVoteId]) {
              priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
              organization = this._copyListsToNewOrganization(organization, priorCopyOfOrganization);
            }
            // And now update the friendsPositionListForAllExceptOneElection
            organization.friends_position_list_for_all_except_one_election = friendsPositionListForAllExceptOneElection;
            // console.log('organization-FRIENDS_ONLY-filter_out_voter: ', organization);
            allCachedOrganizationsDict[organizationWeVoteId] = organization;
            return {
              ...state,
              allCachedOrganizationsDict,
              allCachedPositionsByPositionWeVoteId,
            };
          } else {
            const friendsPositionList = action.res.position_list;
            if (friendsPositionList) {
              friendsPositionList.forEach((onePosition) => {
                mergedPosition = {
                  ...allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id],
                  ...onePosition,
                };
                allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id] = mergedPosition;
                // console.log(action.type, ' FRIENDS_ONLY neither filter_for_voter nor filter_out_voter onePosition:', onePosition);
              });
            }
            organization = allCachedOrganizationsDict[organizationWeVoteId] || {};

            // Make sure to maintain the lists we attach to the organization from other API calls
            if (allCachedOrganizationsDict[organizationWeVoteId]) {
              priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
              organization = this._copyListsToNewOrganization(organization, priorCopyOfOrganization);
            }
            // And now update the friendsPositionList
            organization.friends_position_list = friendsPositionList;
            // console.log('organization-FRIENDS_ONLY-first else: ', organization);
            allCachedOrganizationsDict[organizationWeVoteId] = organization;
            return {
              ...state,
              allCachedOrganizationsDict,
              allCachedPositionsByPositionWeVoteId,
            };
          }
        } else // positionListForOpinionMaker, else for action.res.friends_vs_public === "FRIENDS_ONLY"
        if (action.res.filter_for_voter) {
          // console.log('positionListForOpinionMaker filter_for_voter PART2 true?: ', action.res.filter_for_voter);
          const positionListForOneElection = action.res.position_list;
          if (positionListForOneElection) {
            positionListForOneElection.forEach((onePosition) => {
              mergedPosition = {
                ...allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id],
                ...onePosition,
              };
              allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id] = mergedPosition;
              // console.log(action.type, ' filter_for_voter: True onePosition:', onePosition);
            });
          }
          organization = allCachedOrganizationsDict[organizationWeVoteId] || {};

          // Make sure to maintain the lists we attach to the organization from other API calls
          if (allCachedOrganizationsDict[organizationWeVoteId]) {
            priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
            organization = this._copyListsToNewOrganization(organization, priorCopyOfOrganization);
          }
          // console.log('organization-NOT FRIENDS_ONLY-filter_for_voter: ', organization);
          organization.position_list_for_one_election = positionListForOneElection;
          allCachedOrganizationsDict[organizationWeVoteId] = organization;
          // console.log('positionListForOpinionMaker intake organizationWeVoteId:', organizationWeVoteId);
          if (organization.position_list_for_one_election) {
            if (!allCachedPositionsByOrganization[organizationWeVoteId]) {
              allCachedPositionsByOrganization[organizationWeVoteId] = [];
            }
            if (!allCachedPositionsByOrganizationDict[organizationWeVoteId]) {
              allCachedPositionsByOrganizationDict[organizationWeVoteId] = {};
            }
            organization.position_list_for_one_election.forEach((onePosition) => {
              // console.log('OrganizationStore, positionListForOpinionMaker, onePosition: ', onePosition);
              // Check to see if this position has already been put in this array
              existingPosition = allCachedPositionsByOrganization[organizationWeVoteId].find((possibleMatch) => possibleMatch.position_we_vote_id === onePosition.position_we_vote_id);
              if (!existingPosition) {
                allCachedPositionsByOrganization[organizationWeVoteId].push(onePosition);
              }
              if (onePosition.ballot_item_we_vote_id) {
                allCachedPositionsByOrganizationDict[organizationWeVoteId][onePosition.ballot_item_we_vote_id] = onePosition;
              }
              if (onePosition.contest_office_we_vote_id) {
                allCachedPositionsByOrganizationDict[organizationWeVoteId][onePosition.contest_office_we_vote_id] = onePosition;
              }
            });
          }
          // console.log('allCachedPositionsByOrganization filter_for_voter:', allCachedPositionsByOrganization);
          return {
            ...state,
            allCachedOrganizationsDict,
            allCachedPositionsByOrganization,
            allCachedPositionsByOrganizationDict,
            allCachedPositionsByPositionWeVoteId,
          };
        } else if (action.res.filter_out_voter) {
          // console.log('positionListForOpinionMaker filter_out_voter PART2 true?: ', action.res.filter_out_voter);
          const positionListForAllExceptOneElection = action.res.position_list;
          if (positionListForAllExceptOneElection) {
            positionListForAllExceptOneElection.forEach((onePosition) => {
              mergedPosition = {
                ...allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id],
                ...onePosition,
              };
              allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id] = mergedPosition;
              // console.log(action.type, ' filter_out_voter: True onePosition:', onePosition);
            });
          }
          organization = allCachedOrganizationsDict[organizationWeVoteId] || {};

          let googleCivicElectionIdIndex = 0;
          if (!googleCivicElectionId || googleCivicElectionId === '0' || googleCivicElectionId === 0) {
            googleCivicElectionIdIndex = 0;
          } else {
            googleCivicElectionIdIndex = googleCivicElectionId;
          }
          if (!state.positionListForOpinionMakerHasBeenRetrievedOnce[googleCivicElectionIdIndex]) {
            state.positionListForOpinionMakerHasBeenRetrievedOnce[googleCivicElectionIdIndex] = [];
          }
          state.positionListForOpinionMakerHasBeenRetrievedOnce[googleCivicElectionIdIndex][organizationWeVoteId] = true;

          // Make sure to maintain the lists we attach to the organization from other API calls
          if (allCachedOrganizationsDict[organizationWeVoteId]) {
            priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
            organization = this._copyListsToNewOrganization(organization, priorCopyOfOrganization);
          }
          organization.position_list_for_all_except_one_election = positionListForAllExceptOneElection;
          // console.log('organization-NOT FRIENDS_ONLY-filter_out_voter: ', organization);
          allCachedOrganizationsDict[organizationWeVoteId] = organization;
          if (organization.position_list_for_all_except_one_election) {
            if (!allCachedPositionsByOrganization[organizationWeVoteId]) {
              allCachedPositionsByOrganization[organizationWeVoteId] = [];
            }
            if (!allCachedPositionsByOrganizationDict[organizationWeVoteId]) {
              allCachedPositionsByOrganizationDict[organizationWeVoteId] = {};
            }
            organization.position_list_for_all_except_one_election.forEach((onePosition) => {
              // console.log('OrganizationStore, positionListForOpinionMaker, onePosition: ', onePosition);
              // Check to see if this position has already been put in this array
              existingPosition = allCachedPositionsByOrganization[organizationWeVoteId].find((possibleMatch) => possibleMatch.position_we_vote_id === onePosition.position_we_vote_id);
              if (!existingPosition) {
                allCachedPositionsByOrganization[organizationWeVoteId].push(onePosition);
              }
              if (onePosition.ballot_item_we_vote_id) {
                allCachedPositionsByOrganizationDict[organizationWeVoteId][onePosition.ballot_item_we_vote_id] = onePosition;
              }
              if (onePosition.contest_office_we_vote_id) {
                allCachedPositionsByOrganizationDict[organizationWeVoteId][onePosition.contest_office_we_vote_id] = onePosition;
              }
            });
          }
          // console.log('allCachedPositionsByOrganization filter_out_voter:', allCachedPositionsByOrganization);
          return {
            ...state,
            allCachedOrganizationsDict,
            allCachedPositionsByOrganization,
            allCachedPositionsByOrganizationDict,
            allCachedPositionsByPositionWeVoteId,
          };
        } else {
          // console.log('positionListForOpinionMaker NEITHER filter_out_voter nor filter_for_voter, organizationWeVoteId:', organizationWeVoteId);
          const positionList = action.res.position_list;
          if (positionList) {
            positionList.forEach((onePosition) => {
              mergedPosition = {
                ...allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id],
                ...onePosition,
              };
              allCachedPositionsByPositionWeVoteId[onePosition.position_we_vote_id] = mergedPosition;
              // console.log(action.type, ' final else True onePosition:', onePosition);
            });
          }
          organization = allCachedOrganizationsDict[organizationWeVoteId] || {};

          let googleCivicElectionIdIndex = 0;
          if (!googleCivicElectionId || googleCivicElectionId === '0' || googleCivicElectionId === 0) {
            googleCivicElectionIdIndex = 0;
          } else {
            googleCivicElectionIdIndex = googleCivicElectionId;
          }
          if (!state.positionListForOpinionMakerHasBeenRetrievedOnce[googleCivicElectionIdIndex]) {
            state.positionListForOpinionMakerHasBeenRetrievedOnce[googleCivicElectionIdIndex] = [];
          }
          state.positionListForOpinionMakerHasBeenRetrievedOnce[googleCivicElectionIdIndex][organizationWeVoteId] = true;

          // Make sure to maintain the lists we attach to the organization from other API calls
          if (allCachedOrganizationsDict[organizationWeVoteId]) {
            priorCopyOfOrganization = allCachedOrganizationsDict[organizationWeVoteId];
            organization = this._copyListsToNewOrganization(organization, priorCopyOfOrganization);
          }
          organization.position_list = positionList;
          if (positionList) {
            if (!allCachedPositionsByOrganization[organizationWeVoteId]) {
              allCachedPositionsByOrganization[organizationWeVoteId] = [];
            }
            if (!allCachedPositionsByOrganizationDict[organizationWeVoteId]) {
              allCachedPositionsByOrganizationDict[organizationWeVoteId] = {};
            }
            positionList.forEach((onePosition) => {
              // console.log('OrganizationStore, positionListForOpinionMaker,  NEITHER filter_out_voter nor filter_for_voter,  onePosition: ', onePosition);
              // Check to see if this position has already been put in this array
              existingPosition = allCachedPositionsByOrganization[organizationWeVoteId].find((possibleMatch) => possibleMatch.position_we_vote_id === onePosition.position_we_vote_id);
              if (!existingPosition) {
                allCachedPositionsByOrganization[organizationWeVoteId].push(onePosition);
              }
              if (onePosition.ballot_item_we_vote_id !== undefined) {
                // console.log('onePosition.ballot_item_we_vote_id:', onePosition.ballot_item_we_vote_id);
                allCachedPositionsByOrganizationDict[organizationWeVoteId][onePosition.ballot_item_we_vote_id] = onePosition;
              } else if (onePosition.contest_office_we_vote_id !== undefined) {
                // console.log('onePosition.contest_office_we_vote_id:', onePosition.ballot_item_we_vote_id);
                allCachedPositionsByOrganizationDict[organizationWeVoteId][onePosition.contest_office_we_vote_id] = onePosition;
              }
            });
          }
          // console.log('organization-NOT FRIENDS_ONLY-no filter: ', organization);
          // console.log('allCachedPositionsByOrganization else:', allCachedPositionsByOrganization);
          allCachedOrganizationsDict[organizationWeVoteId] = organization;
          return {
            ...state,
            allCachedOrganizationsDict,
            allCachedPositionsByOrganization,
            allCachedPositionsByOrganizationDict,
            allCachedPositionsByPositionWeVoteId,
          };
        }

      case 'voterGuidesFollowedByOrganizationRetrieve':
        // In VoterGuideStore we listen for "voterGuidesFollowedByOrganizationRetrieve" so we can update
        //  all_cached_voterGuides and organization_we_vote_ids_to_follow_organization_recommendation_dict
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        voterGuides = action.res.voter_guides;
        // We want to show *all* organizations followed by the organization on the "Following" tab
        if (action.res.filter_by_this_google_civic_election_id && action.res.filter_by_this_google_civic_election_id !== '') {
          // Ignore the results if filtered by google_civic_election_id
          return {
            ...state,
          };
        } else {
          // console.log('voterGuidesFollowedByOrganizationRetrieve NO election_id, organizationWeVoteIdForVoterGuideOwner: ', organizationWeVoteIdForVoterGuideOwner);
          organizationWeVoteIdsFollowedByOrganizationDict[organizationWeVoteIdForVoterGuideOwner] = [];
          voterGuides.forEach((oneVoterGuide) => {
            organizationWeVoteIdsFollowedByOrganizationDict[organizationWeVoteIdForVoterGuideOwner].push(oneVoterGuide.organization_we_vote_id);
          });
          return {
            ...state,
            organizationWeVoteIdsFollowedByOrganizationDict,
          };
        }

      case 'voterGuideFollowersRetrieve':
        // In VoterGuideStore, we also listen for a response to "voterGuideFollowersRetrieve" and update all_cached_voterGuides
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        voterGuides = action.res.voter_guides;
        // Reset the followers for this organization
        organizationWeVoteIdsFollowingByOrganizationDict[action.res.organization_we_vote_id] = [];
        voterGuides.forEach((oneVoterGuide) => {
          organizationWeVoteIdsFollowingByOrganizationDict[action.res.organization_we_vote_id].push(oneVoterGuide.organization_we_vote_id);
        });
        return {
          ...state,
          organizationWeVoteIdsFollowingByOrganizationDict,
        };

        // case 'voterGuidesFollowedRetrieve':
        //   // In VoterGuideStore, we listen for a response to "voterGuidesFollowedRetrieve" and update all_cached_voterGuides
        //   // In OrganizationStore, we listen for a response to "organizationsFollowedRetrieve" instead of "voterGuidesFollowedRetrieve"

      case 'voterGuidesIgnoredRetrieve':
        // In OrganizationStore, we also listen for a response to "voterGuidesIgnoredRetrieve" and update organizationWeVoteIdsVoterIsIgnoring
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        voterGuides = action.res.voter_guides;
        organizationWeVoteIdsVoterIsIgnoring = [];
        voterGuides.forEach((oneVoterGuide) => {
          if (!organizationWeVoteIdsVoterIsIgnoring.includes(oneVoterGuide.organization_we_vote_id)) {
            organizationWeVoteIdsVoterIsIgnoring.push(oneVoterGuide.organization_we_vote_id);
          }
        });
        return {
          ...state,
          organizationWeVoteIdsVoterIsIgnoring,
        };

      case 'twitterSignInRetrieve':
      case 'voterEmailAddressSignIn':
      case 'voterFacebookSignInRetrieve':
      case 'voterMergeTwoAccounts':
      case 'voterVerifySecretCode':
        // Voter is signing in
        // console.log('OrganizationStore call OrganizationActions.organizationsFollowedRetrieve action.type:', action.type);
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        OrganizationActions.organizationsFollowedRetrieve();
        revisedState = state;
        revisedState = { ...revisedState,
          organizationWeVoteIdsVoterIsDisliking: [],
          organizationWeVoteIdsVoterIsFollowing: explanationOrganizationsVoterIsFollowing,
          organizationWeVoteIdsVoterIsIgnoring: [],
          organizationWeVoteIdsVoterIsFollowingOnTwitter: [],
          organizationSearchResults: {
            organization_search_term: '',
            organization_twitter_handle: '',
            number_of_search_results: 0,
            organizations_list: [],
          },
          politicianWeVoteIdsVoterIsDisliking: [],
          politicianWeVoteIdsVoterIsFollowing: [],
          voterOrganizationFeaturesProvided: {
            chosenFaviconAllowed: false,
            chosenFeaturePackage: 'FREE',
            chosenFullDomainAllowed: false,
            chosenGoogleAnalyticsAllowed: false,
            chosenSocialShareImageAllowed: false,
            chosenSocialShareDescriptionAllowed: false,
            chosenPromotedOrganizationsAllowed: false,
            featuresProvidedBitmap: 0,
          } };
        return revisedState;

      case 'voterSignOut':
        // console.log('resetting OrganizationStore');
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        OrganizationActions.organizationsFollowedRetrieve();
        return this.resetState();

      case 'voterOpposingSave':
      case 'voterPositionCommentSave':
      case 'voterPositionVisibilitySave':
      case 'voterStopOpposingSave':
      case 'voterStopSupportingSave':
      case 'voterSupportingSave':
        if (!action.res.success) {
          console.log('OrganizationStore ', action.type, ' FAILED action.res:', action.res);
          return state;
        }
        revisedState = state;
        // Voter has done action that modifies one of their positions. Update the position where it is cached.
        ballotItemWeVoteId = action.res.ballot_item_we_vote_id;
        isPublicPosition = action.res.is_public_position;
        positionWeVoteId = action.res.position_we_vote_id;
        statementText = action.res.statement_text;
        voterLinkedOrganizationWeVoteId = VoterStore.getLinkedOrganizationWeVoteId();
        if (positionWeVoteId && voterLinkedOrganizationWeVoteId) {
          if (allCachedPositionsByOrganization[voterLinkedOrganizationWeVoteId]) {
            allCachedPositionsByOrganization[voterLinkedOrganizationWeVoteId].forEach((onePosition) => {
              modifiedPosition = onePosition;
              if (modifiedPosition) {
                if (onePosition.position_we_vote_id === positionWeVoteId) {
                  if (action.type === 'voterOpposingSave') {
                    modifiedPosition = this.modifyPositionObject(modifiedPosition, true, false, false, true, true, false);
                  } else if (action.type === 'voterSupportingSave') {
                    modifiedPosition = this.modifyPositionObject(modifiedPosition, true, false, true, false, false, true);
                  } else if (action.type === 'voterStopOpposingSave') {
                    modifiedPosition = this.modifyPositionObject(modifiedPosition, false, true, true, false, false, false);
                  } else if (action.type === 'voterStopSupportingSave') {
                    modifiedPosition = this.modifyPositionObject(modifiedPosition, false, true, false, false, true, false);
                  } else if (action.type === 'voterPositionCommentSave') {
                    modifiedPosition.statement_text = statementText;
                  } else if (action.type === 'voterPositionVisibilitySave') {
                    modifiedPosition.is_public_position = isPublicPosition;
                  }
                  modifiedPositionChangeFound = true;
                }
                allCachedPositionsForOneOrganization.push(modifiedPosition);
              }
            });
            if (modifiedPositionChangeFound) {
              allCachedPositionsByOrganization[voterLinkedOrganizationWeVoteId] = allCachedPositionsForOneOrganization;
              revisedState = { ...revisedState, allCachedPositionsByOrganization };
            }
          }
        }
        if (positionWeVoteId) {
          modifiedPosition = allCachedPositionsByPositionWeVoteId[positionWeVoteId];
          if (modifiedPosition) {
            if (action.type === 'voterOpposingSave') {
              modifiedPosition = this.modifyPositionObject(modifiedPosition, true, false, false, true, true, false);
            } else if (action.type === 'voterSupportingSave') {
              modifiedPosition = this.modifyPositionObject(modifiedPosition, true, false, true, false, false, true);
            } else if (action.type === 'voterStopOpposingSave') {
              modifiedPosition = this.modifyPositionObject(modifiedPosition, false, true, true, false, false, false);
            } else if (action.type === 'voterStopSupportingSave') {
              modifiedPosition = this.modifyPositionObject(modifiedPosition, false, true, false, false, true, false);
            } else if (action.type === 'voterPositionCommentSave') {
              modifiedPosition.statement_text = statementText;
            } else if (action.type === 'voterPositionVisibilitySave') {
              modifiedPosition.is_public_position = isPublicPosition;
            }
            allCachedPositionsByPositionWeVoteId[positionWeVoteId] = modifiedPosition;
            revisedState = { ...revisedState, allCachedPositionsByPositionWeVoteId };
          }
        }
        if (ballotItemWeVoteId && voterLinkedOrganizationWeVoteId) {
          if (allCachedPositionsByOrganizationDict[voterLinkedOrganizationWeVoteId] && allCachedPositionsByOrganizationDict[voterLinkedOrganizationWeVoteId][ballotItemWeVoteId]) {
            modifiedPosition = allCachedPositionsByOrganizationDict[voterLinkedOrganizationWeVoteId][ballotItemWeVoteId];
            if (modifiedPosition) {
              if (action.type === 'voterOpposingSave') {
                modifiedPosition = this.modifyPositionObject(modifiedPosition, true, false, false, true, true, false);
              } else if (action.type === 'voterSupportingSave') {
                modifiedPosition = this.modifyPositionObject(modifiedPosition, true, false, true, false, false, true);
              } else if (action.type === 'voterStopOpposingSave') {
                modifiedPosition = this.modifyPositionObject(modifiedPosition, false, true, true, false, false, false);
              } else if (action.type === 'voterStopSupportingSave') {
                modifiedPosition = this.modifyPositionObject(modifiedPosition, false, true, false, false, true, false);
              } else if (action.type === 'voterPositionCommentSave') {
                modifiedPosition.statement_text = statementText;
              } else if (action.type === 'voterPositionVisibilitySave') {
                modifiedPosition.is_public_position = isPublicPosition;
              }
              allCachedPositionsByOrganizationDict[voterLinkedOrganizationWeVoteId][ballotItemWeVoteId] = modifiedPosition;
              revisedState = { ...revisedState, allCachedPositionsByOrganizationDict };
            }
          }
        }
        return revisedState;

      case 'error-organizationFollowIgnore' || 'error-organizationFollow':
        console.log('error: ', action);
        return state;

      default:
        return state;
    }
  }
}

export default new OrganizationStore(Dispatcher);
