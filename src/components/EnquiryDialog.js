import React, { useEffect, Fragment, useRef } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { injectIntl } from "react-intl";

import { Dialog, Button, DialogActions, DialogContent, Table, TableHead, TableBody, TableRow, TableCell, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import {
  formatMessage,
  formatMessageWithValues,
  Contributions,
  Error,
  ProgressOrError,
  withModulesManager,
  withHistory,
  historyPush,
} from "@openimis/fe-core";
import { fetchInsuree, fetchSubFamilySummary } from "../actions";
import InsureeSummary from "./InsureeSummary";
import FamilyMembersTable from "./FamilyMembersTable";

const useStyles = makeStyles((theme) => ({
  summary: {
    marginBottom: 32,
  },
  tableContainer: {
    marginTop: 16,
  },
  tableRow: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  tableHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  tableCell: {
    color: theme.palette.primary.contrastText,
  }
}));

const EnquiryDialog = ({
  intl,
  modulesManager,
  fetchInsuree,
  fetchSubFamilySummary,
  fetching,
  fetched,
  insuree,
  subfamilies,
  fetchingSubFamilies,
  error,
  onClose,
  open,
  chfid,
  match,
  history,
}) => {
  const classes = useStyles();
  const prevMatchUrl = useRef(null);

  useEffect(() => {
    if (open && insuree?.id !== chfid) {
      fetchInsuree(modulesManager, chfid);
    }

    if (!!match?.url && match.url !== prevMatchUrl.current) {
      onClose();
    }

    if (!!match?.url) {
      prevMatchUrl.current = match.url;
    }
  }, [open, chfid, match?.url]);

  useEffect(() => {
    if (insuree?.family?.uuid) {
      fetchSubFamilySummary(modulesManager, { parent_Uuid: insuree.family.uuid, isHead: false });
    }
  }, [insuree?.family?.uuid]);

  const onDoubleClick = (subfamily, newTab = false) => {
    onClose();
    historyPush(
      modulesManager,
      history,
      "insuree.route.subFamilyOverview",
      [subfamily.uuid, insuree.family.uuid, subfamily.headInsuree.uuid],
      newTab
    );
  };

  return (
    <Dialog maxWidth="xl" fullWidth open={open} onClose={onClose}>
      <DialogContent>
        <ProgressOrError progress={fetching} error={error} />
        {!!fetched && !insuree && (
          <Error
            error={{
              code: formatMessage(intl, "insuree", "notFound"),
              detail: formatMessageWithValues(intl, "insuree", "chfIdNotFound", { chfid }),
            }}
          />
        )}
        {!fetching && insuree && (
          <Fragment>
            <InsureeSummary modulesManager={modulesManager} insuree={insuree} className={classes.summary} />
            {subfamilies?.filter(subfamily => subfamily.parent?.id === insuree?.family?.id).length > 0 ? (
              <Paper className={classes.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow className={classes.tableHeader}>
                      <TableCell className={classes.tableCell}>{formatMessage(intl, "insuree", "familySummaries.insuranceNo")}</TableCell>
                      <TableCell className={classes.tableCell}>{formatMessage(intl, "insuree", "familySummaries.lastName")}</TableCell>
                      <TableCell className={classes.tableCell}>{formatMessage(intl, "insuree", "familySummaries.otherNames")}</TableCell>
                      <TableCell className={classes.tableCell}>{formatMessage(intl, "insuree", "familySummaries.email")}</TableCell>
                      <TableCell className={classes.tableCell}>{formatMessage(intl, "insuree", "familySummaries.phone")}</TableCell>
                      <TableCell className={classes.tableCell}>{formatMessage(intl, "insuree", "familySummaries.dob")}</TableCell>
                      <TableCell className={classes.tableCell}>{formatMessage(intl, "insuree", "familySummaries.photo")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subfamilies
                      .filter(subfamily => subfamily.parent?.id === insuree?.family?.id)
                      .map((subfamily) => (
                      <TableRow 
                        key={subfamily.uuid}
                        className={classes.tableRow}
                        onDoubleClick={() => onDoubleClick(subfamily)}
                      >
                        <TableCell>{subfamily.headInsuree?.chfId || ''}</TableCell>
                        <TableCell>{subfamily.headInsuree?.lastName || ''}</TableCell>
                        <TableCell>{subfamily.headInsuree?.otherNames || ''}</TableCell>
                        <TableCell>{subfamily.headInsuree?.email || ''}</TableCell>
                        <TableCell>{subfamily.headInsuree?.phone || ''}</TableCell>
                        <TableCell>{subfamily.headInsuree?.dob || ''}</TableCell>
                        <TableCell>
                          {subfamily.headInsuree?.photo ? (
                            <img
                              src={`data:image/jpeg;base64,${subfamily.headInsuree.photo.photo}`}
                              alt=""
                              style={{ width: '80px', height: '80px', objectFit: 'fill', borderRadius: '80%' }}
                            />
                          ) : (
                            <Typography>No Photo</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            ) : (
              <FamilyMembersTable history={history} insuree={insuree} />
            )}
            <Contributions
              contributionKey="insuree.EnquiryDialog"
              insuree={insuree}
              disableSelection
              hideAddPolicyButton
            />
          </Fragment>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {formatMessage(intl, "insuree", "close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const mapStateToProps = (state) => ({
  fetching: state.insuree.fetchingInsuree,
  fetchingSubFamilies: state.insuree.fetchingSubFamilies,
  fetched: state.insuree.fetchedInsuree,
  insuree: state.insuree.insuree,
  subfamilies: state.insuree.subFamilies,
  error: state.insuree.errorInsuree,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchInsuree, fetchSubFamilySummary }, dispatch);

export default withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(EnquiryDialog))));