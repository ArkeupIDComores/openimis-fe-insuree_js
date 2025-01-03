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
import { fetchInsuree, fetchSubFamilySummary, clearSubFamily, clearInsuree, fetchFamily } from "../actions";
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
  fetchFamily,
  clearSubFamily,
  clearInsuree,
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
  const currentPath = history?.location?.pathname;

  const getFamilyUuidFromPath = (path) => {
    if (!path) return null;
    const familyOverviewMatch = path.match(/\/insuree\/families\/familyOverview\/([^/]+)/);
    return familyOverviewMatch ? familyOverviewMatch[1] : null;
  };

  const refreshCurrentFamily = () => {
    const familyUuid = getFamilyUuidFromPath(currentPath);
    if (familyUuid) {
      console.log("[EnquiryDialog] Refreshing current family data:", familyUuid);
      fetchFamily(modulesManager, familyUuid);
    }
  };

  const handleClose = () => {
    clearSubFamily();
    clearInsuree();
    onClose();
    refreshCurrentFamily();
  };

  useEffect(() => {
    if (open && insuree?.id !== chfid) {
      console.log("[EnquiryDialog] Fetching insuree with chfid:", chfid);
      fetchInsuree(modulesManager, chfid);
    }

    if (!!match?.url && match.url !== prevMatchUrl.current) {
      handleClose();
    }

    if (!!match?.url) {
      prevMatchUrl.current = match.url;
    }
  }, [open, chfid, match?.url]);

  useEffect(() => {
    console.log("[EnquiryDialog] Current insuree:", {
      id: insuree?.id,
      chfId: insuree?.chfId,
      familyId: insuree?.family?.id,
      familyUuid: insuree?.family?.uuid,
      familyType: insuree?.family?.familyType?.code,
      isHead: insuree?.head,
      headId: insuree?.family?.headInsuree?.id,
      parentFamilyId: insuree?.family?.parent?.id,
      parentFamilyUuid: insuree?.family?.parent?.uuid,
      parentFamilyType: insuree?.family?.parent?.familyType?.code,
      parentHeadId: insuree?.family?.parent?.headInsuree?.id
    });

    // Débogage détaillé pour le type de famille parente
    if (insuree?.family?.parent) {
      console.warn("[EnquiryDialog] Parent Family Details:", {
        parentFamily: insuree.family.parent,
        parentFamilyTypeRaw: insuree.family.parent.familyType,
        parentFamilyTypeCode: insuree.family.parent.familyType?.code,
        parentFamilyTypeExists: !!insuree.family.parent.familyType,
        parentFamilyTypeKeys: Object.keys(insuree.family.parent.familyType || {})
      });
    }

    if (insuree?.family?.uuid) {
      // Si l'assuré est dans une sous-famille
      if (insuree.family?.parent?.uuid) {
        console.log("[EnquiryDialog] Insuree is in a subfamily");
        // Chercher les sous-familles de la famille parente
        fetchSubFamilySummary(modulesManager, { parent_Uuid: insuree.family.parent.uuid });
      } else {
        // Chercher les sous-familles de la famille actuelle
        console.log("[EnquiryDialog] Insuree is in main family");
        fetchSubFamilySummary(modulesManager, { parent_Uuid: insuree.family.uuid });
      }
    }
  }, [insuree?.family?.uuid]);

  const isPolygamousHead = () => {
    // Vérification plus robuste pour déterminer si l'assuré est chef de famille
    const isHead = 
      insuree?.head || 
      insuree?.family?.headInsuree?.id === insuree?.id ||
      // Vérifier si l'ID de l'assuré correspond à l'ID du chef de la famille parente
      insuree?.id === insuree?.family?.parent?.headInsuree?.id;
    
    // Recherche de la famille polygame originale
    const findPolygamousFamily = (family) => {
      // Si la famille actuelle est polygame, la retourner
      if (family?.familyType?.code === 'P') return family;
      
      // Sinon, chercher dans la famille parente
      if (family?.parent?.familyType?.code === 'P') return family.parent;
      
      return null;
    };

    const polygamousFamily = findPolygamousFamily(insuree?.family);
    
    console.warn("[EnquiryDialog] Polygamous Head Comprehensive Check:", {
      isHead,
      currentFamily: {
        uuid: insuree?.family?.uuid,
        type: insuree?.family?.familyType?.code,
        headId: insuree?.family?.headInsuree?.id
      },
      parentFamily: {
        uuid: insuree?.family?.parent?.uuid,
        type: insuree?.family?.parent?.familyType?.code,
        headId: insuree?.family?.parent?.headInsuree?.id
      },
      foundPolygamousFamily: {
        uuid: polygamousFamily?.uuid,
        type: polygamousFamily?.familyType?.code
      },
      insureeDetails: {
        id: insuree?.id,
        head: insuree?.head
      }
    });

    // Un chef polygame reste un chef polygame, même s'il est dans une sous-famille "H"
    return isHead && !!polygamousFamily;
  };

  const getSubFamiliesList = () => {
    if (!subfamilies || !isPolygamousHead()) return [];
    
    // Recherche de la famille polygame originale
    const findPolygamousFamily = (family) => {
      if (family?.familyType?.code === 'P') return family;
      if (family?.parent?.familyType?.code === 'P') return family.parent;
      return null;
    };

    const polygamousFamily = findPolygamousFamily(insuree?.family);
    
    console.warn("[EnquiryDialog] Subfamily Selection:", {
      polygamousFamilyUuid: polygamousFamily?.uuid,
      polygamousFamilyType: polygamousFamily?.familyType?.code,
      currentFamilyUuid: insuree?.family?.uuid,
      currentFamilyType: insuree?.family?.familyType?.code
    });

    // Filtrer les sous-familles de la famille polygame originale
    return subfamilies.filter(subfamily => 
      subfamily.parent?.id === polygamousFamily?.id
    );
  };

  const isPolygamousHeadWithSubFamilies = () => {
    // Condition spécifique : 
    // 1. Si l'ID de l'assuré est le même que le parentHeadId
    // 2. ET si le headId est différent de l'ID de l'assuré
    const isPolygamousHeadWithSubFamily = 
      insuree?.id === insuree?.family?.parent?.headInsuree?.id &&
      insuree?.id !== insuree?.family?.headInsuree?.id;

    console.warn("[EnquiryDialog] Polygamous Head with Subfamilies Check:", {
      insureeId: insuree?.id,
      familyHeadId: insuree?.family?.headInsuree?.id,
      parentHeadId: insuree?.family?.parent?.headInsuree?.id,
      parentFamilyType: insuree?.family?.parent?.familyType?.code,
      isPolygamousHeadWithSubFamily
    });

    return isPolygamousHeadWithSubFamily;
  };

  const onDoubleClick = (subfamily, newTab = false) => {
    console.log("[EnquiryDialog] Opening subfamily:", {
      subfamilyUuid: subfamily.uuid,
      familyUuid: insuree.family.uuid,
      headInsureeUuid: subfamily.headInsuree.uuid
    });
    
    handleClose();
    historyPush(
      modulesManager,
      history,
      "insuree.route.subFamilyOverview",
      [subfamily.uuid, insuree.family.uuid, subfamily.headInsuree.uuid],
      newTab
    );
  };
  
  const getDisplayContent = () => {
    // Si c'est un chef de famille polygame avec sous-familles, afficher les sous-familles
    if (isPolygamousHeadWithSubFamilies()) {
      const subFamiliesList = getSubFamiliesList();
      
      console.warn("[EnquiryDialog] Displaying Subfamilies:", {
        subFamiliesCount: subFamiliesList.length,
        subFamilies: subFamiliesList
      });

      return (
        <>
          <Typography variant="h6" style={{ marginBottom: '16px' }}>
            {formatMessage(intl, "insuree", "SubFamilies.title")} ({subFamiliesList.length})
          </Typography>
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
                {subFamiliesList.map((subfamily) => (
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
        </>
      );
    }

    // Sinon, afficher les membres de la famille
    return <FamilyMembersTable insuree={insuree} history={history} />;
  };


  return (
    <Dialog maxWidth="xl" fullWidth open={open} onClose={handleClose}>
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
            {getDisplayContent()}
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
        <Button onClick={handleClose} color="primary">
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

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchInsuree, fetchSubFamilySummary, fetchFamily, clearSubFamily, clearInsuree }, dispatch);

export default withModulesManager(withHistory(connect(mapStateToProps, mapDispatchToProps)(injectIntl(EnquiryDialog))));