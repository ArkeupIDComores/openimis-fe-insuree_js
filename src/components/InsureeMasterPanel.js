import React from "react";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { Paper, Grid, Typography, Divider, Checkbox, FormControlLabel } from "@material-ui/core";
import {
  formatMessage,
  withTooltip,
  FormattedMessage,
  PublishedComponent,
  FormPanel,
  TextInput,
  Contributions,
  withModulesManager,
} from "@openimis/fe-core";

const styles = (theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: "100%",
  },
});
import { DEFAULT, FAMILY_TYPE_POLYGAMY_CODE, INSUREE_PREFERRED_PAYMENT_METHOD } from "../constants";

const INSUREE_INSUREE_CONTRIBUTION_KEY = "insuree.Insuree";
const INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY = "insuree.Insuree.panels";

class InsureeMasterPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.isInsureeStatusRequired = props.modulesManager.getConf(
      "fe-insuree",
      "insureeForm.isInsureeStatusRequired",
      false,
    );
    this.renderLastNameFirst = props.modulesManager.getConf(
      "fe-insuree",
      "renderLastNameFirst",
      DEFAULT.RENDER_LAST_NAME_FIRST,
    );
    this.fields = props.modulesManager.getConf("fe-insuree", "fields", "{}");
    this.passportLength = props.modulesManager.getConf("fe-insuree", "passportLength", 7);
    this.insureeChildId = props.modulesManager.getConf(
      "fe-insuree", 
      "insureeForm.insureeChildId", 
      4
    );
  }

  renderLastNameField = (edited, classes, readOnly) => {
    return (
      <Grid item xs={4} className={classes.item}>
        <TextInput
          module="insuree"
          label="Insuree.lastName"
          required={true}
          readOnly={readOnly}
          value={!!edited && !!edited.lastName ? edited.lastName : ""}
          onChange={(v) => this.updateAttribute("lastName", v)}
        />
      </Grid>
    );
  };

  renderGivenNameField = (edited, classes, readOnly) => (
    <Grid item xs={4} className={classes.item}>
      <TextInput
        module="insuree"
        label="Insuree.otherNames"
        required={true}
        readOnly={readOnly}
        value={!!edited && !!edited.otherNames ? edited.otherNames : ""}
        onChange={(v) => this.updateAttribute("otherNames", v)}
      />
    </Grid>
  );

  render() {
    const {
      intl,
      classes,
      edited,
      title = "Insuree.title",
      titleParams = { label: "" },
      readOnly = true,
      actions,
      edited_id,
      isSubFamily,
      insuree,
    } = this.props;

    return (
      <Grid container>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.tableTitle}>
              <Grid item xs={3} container alignItems="center" className={classes.item}>
                <Typography variant="h5">
                  <FormattedMessage module="insuree" id={title} values={titleParams} />
                </Typography>
              </Grid>
              <Grid item xs={9}>
                <Grid container justify="flex-end">
                  {!!edited &&
                    !!edited.family &&
                    !!edited.family.headInsuree &&
                    edited.family.headInsuree.id !== edited.id && (
                      <Grid item xs={3}>
                        <PublishedComponent
                          pubRef="insuree.RelationPicker"
                          withNull={true}
                          required={true}
                          nullLabel={formatMessage(this.props.intl, "insuree", `Relation.none`)}
                          readOnly={readOnly}
                          value={!!edited && !!edited.relationship ? edited.relationship.id : ""}
                          onChange={(v) => this.updateAttribute("relationship", { id: v })}
                        />
                      </Grid>
                    )}
                  {!!actions &&
                    actions.map((a, idx) => {
                      return (
                        <Grid item key={`form-action-${idx}`} className={classes.paperHeaderAction}>
                          {withTooltip(a.button, a.tooltip)}
                        </Grid>
                      );
                    })}
                </Grid>
              </Grid>
            </Grid>
            <Divider />
            <Grid container className={classes.item}>
              {(!!edited && !edited.chfId) || !edited ? null : (
                <Grid item xs={4} className={classes.item}>
                  <PublishedComponent
                    pubRef="insuree.InsureeNumberInput"
                    module="insuree"
                    label="Insuree.chfId"
                    required={true}
                    readOnly={true}
                    value={edited?.chfId}
                    edited_id={edited_id}
                    onChange={(v) => this.updateAttribute("chfId", v)}
                  />
                </Grid>
              )}
              {this.renderLastNameFirst ? (
                <>
                  {this.renderLastNameField(edited, classes, readOnly)}
                  {this.renderGivenNameField(edited, classes, readOnly)}
                </>
              ) : (
                <>
                  {this.renderGivenNameField(edited, classes, readOnly)}
                  {this.renderLastNameField(edited, classes, readOnly)}
                </>
              )}
              <Grid item xs={8}>
                <Grid container>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="core.DatePicker"
                      value={!!edited ? edited.dob : null}
                      module="insuree"
                      label="Insuree.dob"
                      readOnly={readOnly}
                      required={true}
                      maxDate={new Date()}
                      onChange={(v) => this.updateAttribute("dob", v)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureeGenderPicker"
                      value={!!edited && !!edited.gender ? edited.gender.code : ""}
                      module="insuree"
                      readOnly={readOnly}
                      withNull={false}
                      required={true}
                      onChange={(v) => this.updateAttribute("gender", { code: v })}
                    />
                  </Grid>
                  {!!isSubFamily && isSubFamily == true ? null : (
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="insuree.InsureeMaritalStatusPicker"
                        value={!!edited && !!edited.marital ? edited.marital : "N"}
                        module="insuree"
                        readOnly={readOnly}
                        withNull={true}
                        onChange={(v) => this.updateAttribute("marital", v)}
                      />
                    </Grid>
                  )}
                  {edited?.marital == FAMILY_TYPE_POLYGAMY_CODE ? (
                    <Grid item xs={3} className={classes.item}>
                      <TextInput
                        module="insuree"
                        label="Insuree.otherHousehold"
                        readOnly={readOnly}
                        value={!!edited && !!edited.coordinates ? edited.coordinates : ""}
                        onChange={(v) => this.updateAttribute("coordinates", v)}
                      />
                    </Grid>
                  ) : null}
                  <Grid item xs={3} className={classes.item}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          color="primary"
                          checked={!!edited && !!edited.cardIssued}
                          disabled={readOnly}
                          onChange={(v) => this.updateAttribute("cardIssued", !edited || !edited.cardIssued)}
                        />
                      }
                      label={formatMessage(intl, "insuree", "Insuree.cardIssued")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <PublishedComponent
                      pubRef="insuree.InsureeAddress"
                      value={edited}
                      module="insuree"
                      readOnly={readOnly}
                      onChangeLocation={(v) => this.updateAttribute("currentVillage", v)}
                      onChangeAddress={(v) => this.updateAttribute("currentAddress", v)}
                    />
                  </Grid>

                  <Grid item xs={6} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.phone"
                      readOnly={readOnly}
                      required={
                        (!insuree || insuree == null || (!!insuree && insuree.head == true)) &&
                        this.fields.phoneNoHead == "M"
                          ? true
                          : false
                      }
                      value={!!edited && !!edited.phone ? edited.phone : ""}
                      onChange={(v) => this.updateAttribute("phone", v)}
                    />
                  </Grid>

                  <Grid item xs={6} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.email"
                      readOnly={readOnly}
                      value={!!edited && !!edited.email ? edited.email : ""}
                      onChange={(v) => this.updateAttribute("email", v)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.professionalSituation"
                      readOnly={readOnly}
                      value={!!edited && !!edited.professionalSituation ? edited.professionalSituation : ""}
                      onChange={(v) => this.updateAttribute("professionalSituation", !!v ? v : null)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.ProfessionPicker"
                      module="insuree"
                      value={!!edited && !!edited.profession ? edited.profession.id : null}
                      readOnly={readOnly}
                      required={true}
                      withNull={false}
                      onChange={(v) => this.updateAttribute("profession", { id: v })}
                    />
                  </Grid>
                  {!!edited && !!edited.relationship && edited.relationship.id == this.insureeChildId && (
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="insuree.EducationPicker"
                        module="insuree"
                        value={!!edited && !!edited.education ? edited.education.id : ""}
                        required={!!edited && !!edited.relationship && edited.relationship.id == this.insureeChildId ? true : false}
                        readOnly={readOnly}
                        withNull={false}
                        onChange={(v) => this.updateAttribute("education", { id: v })}
                      />
                    </Grid>
                  )}
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.IdentificationTypePicker"
                      module="insuree"
                      value={!!edited && !!edited.typeOfId ? edited.typeOfId.code : null}
                      readOnly={readOnly}
                      withNull={false}
                      onChange={(v) => this.updateAttribute("typeOfId", { code: v })}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <TextInput
                      module="insuree"
                      label="Insuree.passport"
                      error={
                        edited &&
                        edited.passport &&
                        (edited.passport.length > this.passportLength || edited.passport.length < this.passportLength)
                          ? true
                          : false
                      }
                      readOnly={readOnly}
                      required={true}
                      value={!!edited && !!edited.passport ? edited.passport : ""}
                      onChange={(v) => this.updateAttribute("passport", !!v ? v : null)}
                    />
                  </Grid>
                  <Grid item xs={3} className={classes.item}>
                    <PublishedComponent
                      pubRef="insuree.InsureIncomeLevelPicker"
                      module="insuree"
                      value={!!edited && !!edited.incomeLevel ? edited.incomeLevel : null}
                      readOnly={readOnly}
                      withNull={false}
                      required={true}
                      onChange={(v) => this.updateAttribute("incomeLevel", v)}
                    />
                  </Grid>
                  {(!!edited && !!edited.family && !!edited.family.headInsuree && edited?.head == true) ||
                  (!!edited && !edited.family) ? (
                    <Grid item xs={3} className={classes.item}>
                      <PublishedComponent
                        pubRef="insuree.PaymentMethodPicker"
                        module="insuree"
                        value={!!edited && !!edited.preferredPaymentMethod ? edited.preferredPaymentMethod : ""}
                        readOnly={readOnly}
                        withNull={true}
                        nullLabel={formatMessage(intl, "insuree", "insuree.Payment.none")}
                        onChange={(v) => this.updateAttribute("preferredPaymentMethod", v)}
                      />
                    </Grid>
                  ) : null}
                  {edited?.preferredPaymentMethod == INSUREE_PREFERRED_PAYMENT_METHOD && (
                    <Grid item xs={3} className={classes.item}>
                      <TextInput
                        module="insuree"
                        label="Insuree.accountDetails"
                        readOnly={readOnly}
                        required={true}
                        value={!!edited && !!edited.bankCoordinates ? edited.bankCoordinates : ""}
                        onChange={(v) => this.updateAttribute("bankCoordinates", !!v ? v : null)}
                      />
                    </Grid>
                  )}
                </Grid>
              </Grid>
              <Grid item xs={4} className={classes.item}>
                <PublishedComponent
                  pubRef="insuree.Avatar"
                  photo={!!edited ? edited.photo : null}
                  readOnly={readOnly}
                  withMeta={true}
                  onChange={(v) => this.updateAttribute("photo", !!v ? v : null)}
                />
              </Grid>
              <Contributions
                {...this.props}
                updateAttribute={this.updateAttribute}
                contributionKey={INSUREE_INSUREE_CONTRIBUTION_KEY}
              />
            </Grid>
          </Paper>
          <Contributions
            {...this.props}
            updateAttribute={this.updateAttribute}
            contributionKey={INSUREE_INSUREE_PANELS_CONTRIBUTION_KEY}
          />
        </Grid>
      </Grid>
    );
  }
}

export default withModulesManager(withTheme(withStyles(styles)(InsureeMasterPanel)));
