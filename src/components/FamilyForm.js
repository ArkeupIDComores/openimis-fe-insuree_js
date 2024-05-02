import React, { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import ReplayIcon from "@material-ui/icons/Replay";
import {
  formatMessageWithValues,
  withModulesManager,
  withHistory,
  historyPush,
  Form,
  ProgressOrError,
  journalize,
  coreConfirm,
  parseData,
  Helmet,
} from "@openimis/fe-core";
import { RIGHT_FAMILY, RIGHT_FAMILY_EDIT } from "../constants";
import FamilyMasterPanel from "./FamilyMasterPanel";

import { fetchFamily, newFamily, createFamily, fetchFamilyMutation } from "../actions";
import FamilyInsureesOverview from "./FamilyInsureesOverview";
import SubFamiliesSummary from "./SubFamiliesSummary";
import HeadInsureeMasterPanel from "./HeadInsureeMasterPanel";

import { insureeLabel, isValidInsuree } from "../utils/utils";

const styles = (theme) => ({
  lockedPage: theme.page.locked,
});

const INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY = "insuree.Family.panels";
const INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY = "insuree.FamilyOverview.panels";
const INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY = "insuree.FamilyOverview.mutations";

class FamilyForm extends Component {
  state = {
    lockNew: false,
    reset: 0,
    family: this._newFamily(),
    newFamily: true,
    confirmedAction: null,
  };

  _newFamily() {
    let family = {};
    family.jsonExt = {};
    return family;
  }

  componentDidMount() {
    if (this.props.family_uuid) {
      this.setState(
        (state, props) => ({ family_uuid: props.family_uuid }),
        (e) => this.props.fetchFamily(this.props.modulesManager, this.props.family_uuid),
      );
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.fetchedFamily && !!this.props.fetchedFamily) {
      var family = this.props.family;
      if (family) {
        family.ext = !!family.jsonExt ? JSON.parse(family.jsonExt) : {};
        this.setState({ family, family_uuid: family.uuid, lockNew: false, newFamily: false });
      }
    } else if (prevProps.family_uuid && !this.props.family_uuid) {
      this.setState({ family: this._newFamily(), newFamily: true, lockNew: false, family_uuid: null });
    } else if (prevProps.submittingMutation && !this.props.submittingMutation) {
      this.props.journalize(this.props.mutation);
      this.setState((state, props) => ({
        family: { ...state.family, clientMutationId: props.mutation.clientMutationId },
      }));
    } else if (prevProps.confirmed !== this.props.confirmed && !!this.props.confirmed && !!this.state.confirmedAction) {
      this.state.confirmedAction();
    }
  }

  _add = () => {
    this.setState(
      (state) => ({
        family: this._newFamily(),
        newFamily: true,
        lockNew: false,
        reset: state.reset + 1,
      }),
      (e) => {
        this.props.add();
        this.forceUpdate();
      },
    );
  };

  reload = () => {
    const { family } = this.state;
    const { clientMutationId, familyUuid } = this.props.mutation;
    if (clientMutationId && !familyUuid) {
      // creation, we need to fetch the new family uuid from mutations logs and redirect to family overview
      this.props.fetchFamilyMutation(this.props.modulesManager, clientMutationId).then((res) => {
        const mutationLogs = parseData(res.payload.data.mutationLogs);
        if (
          mutationLogs &&
          mutationLogs[0] &&
          mutationLogs[0].families &&
          mutationLogs[0].families[0] &&
          mutationLogs[0].families[0].family
        ) {
          const uuid = parseData(res.payload.data.mutationLogs)[0].families[0].family.uuid;
          if (uuid) {
            historyPush(this.props.modulesManager, this.props.history, "insuree.route.familyOverview", [uuid]);
          }
        }
      });
    } else {
      this.props.fetchFamily(
        this.props.modulesManager,
        familyUuid,
        !!family.headInsuree ? family.headInsuree.chfId : null,
        family.clientMutationId,
      );
    }
  };

  canSave = () => {
    if (!this.state.family.location) return false;
    // if (!this.state.family.uuid && !this.props.isChfIdValid) return false;
    if (this.state.family.validityTo) return false;
    if (!!this.state.family.headInsuree && this.state.family.headInsuree.marital === 'P' && this.props.subFamily.length<=0) return false;


    return this.state.family.headInsuree && isValidInsuree(this.state.family.headInsuree, this.props.modulesManager);
  };

  _save = (family) => {
    this.setState(
      { lockNew: !family.uuid }, // avoid duplicates
      (e) => this.props.save(family),
    );
  };

  onEditedChanged = (family) => {
    this.setState({ family, newFamily: false });
  };

  onActionToConfirm = (title, message, confirmedAction) => {
    this.setState({ confirmedAction }, this.props.coreConfirm(title, message));
  };

  render() {
    const {
      modulesManager,
      classes,
      state,
      rights,
      family_uuid,
      fetchingFamily,
      fetchedFamily,
      errorFamily,
      insuree,
      overview = false,
      openFamilyButton,
      readOnly = false,
      add,
      save,
      back,
      mutation,
    } = this.props;
    console.log('etat de la famille',this.state);
    console.log('props de la famille', this.props.subFamily.length);
    const { family, newFamily } = this.state;
    if (!rights.includes(RIGHT_FAMILY)) return null;
    let runningMutation = !!family && !!family.clientMutationId;
    let contributedMutations = modulesManager.getContribs(INSUREE_FAMILY_OVERVIEW_CONTRIBUTED_MUTATIONS_KEY);
    for (let i = 0; i < contributedMutations.length && !runningMutation; i++) {
      runningMutation = contributedMutations[i](state);
    }
    let actions = [];
    if (family_uuid || !!family.clientMutationId) {
      actions.push({
        doIt: this.reload,
        icon: <ReplayIcon />,
        onlyIfDirty: !readOnly && !runningMutation,
      });
    }
    const shouldBeLocked = !!runningMutation || family?.validityTo;
    return (
      <div className={shouldBeLocked ? classes.lockedPage : null}>
        <Helmet
          title={formatMessageWithValues(
            this.props.intl,
            "insuree",
            !!this.props.overview ? "FamilyOverview.title" : "Family.title",
            { label: insureeLabel(this.state.family.headInsuree) },
          )}
        />
        <ProgressOrError progress={fetchingFamily} error={errorFamily} />
        {((!!fetchedFamily && !!family && family.uuid === family_uuid) || !family_uuid) && (
          <Form
            module="insuree"
            title="FamilyOverview.title"
            titleParams={{ label: insureeLabel(this.state.family.headInsuree) }}
            edited_id={family_uuid}
            edited={family}
            reset={this.state.reset}
            back={back}
            add={!!add && !newFamily ? this._add : null}
            readOnly={readOnly || runningMutation || !!family.validityTo}
            actions={actions}
            openFamilyButton={openFamilyButton}
            overview={overview}
            HeadPanel={FamilyMasterPanel}
            Panels={(overview &&  (family.headInsuree && family.headInsuree.marital == 'P'))? [ SubFamiliesSummary] : (family.headInsuree && family.headInsuree.marital == 'P') ? [HeadInsureeMasterPanel, SubFamiliesSummary] : [HeadInsureeMasterPanel] }
            contributedPanelsKey={
              overview ? INSUREE_FAMILY_OVERVIEW_PANELS_CONTRIBUTION_KEY : INSUREE_FAMILY_PANELS_CONTRIBUTION_KEY
            }
            family={family}
            insuree={insuree}
            onEditedChanged={this.onEditedChanged}
            canSave={this.canSave}
            save={!!save  ? this._save : null}
            onActionToConfirm={this.onActionToConfirm}
            openDirty={ save}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
  fetchingFamily: state.insuree.fetchingFamily,
  errorFamily: state.insuree.errorFamily,
  fetchedFamily: state.insuree.fetchedFamily,
  family: state.insuree.family,
  subFamily: state.insuree.subFamily,
  submittingMutation: state.insuree.submittingMutation,
  mutation: state.insuree.mutation,
  insuree: state.insuree.insuree,
  confirmed: state.core.confirmed,
  state: state,
  isChfIdValid: state.insuree?.validationFields?.insureeNumber?.isValid,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    { fetchFamilyMutation, fetchFamily, newFamily, createFamily, journalize, coreConfirm },
    dispatch,
  );
};

export default withHistory(
  withModulesManager(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme(withStyles(styles)(FamilyForm)))),
  ),
);
