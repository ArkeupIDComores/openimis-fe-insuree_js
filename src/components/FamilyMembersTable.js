import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  TableContainer,
  TableHead,
  TableBody,
  Table,
  TableCell,
  TableRow,
  Paper,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

import { useModulesManager, useTranslations, historyPush } from "@openimis/fe-core";
import { fetchFamilyMembers } from "../actions";
import { DEFAULT, HYPHEN, MODULE_NAME } from "../constants";

const useStyles = makeStyles((theme) => ({
  tableContainer: {
    marginTop: theme.spacing(1),
  },
  tableHeader: {
    backgroundColor: theme.palette.primary.main,
  },
  headerCell: {
    color: theme.palette.primary.contrastText,
    fontWeight: 500,
  },
  tableRow: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  paper: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

const FAMILY_MEMBERS_HEADERS = [
  "FamilyMembersTable.InsuranceNo",
  "FamilyMembersTable.memberName",
  "FamilyMembersTable.phone",
  "FamilyMembersTable.gender",
  "FamilyMembersTable.birthDate",
  "FamilyMembersTable.beneficiaryCard",
  "FamilyMembersTable.photo",
];

const FamilyMembersTable = ({ history, insuree }) => {
  const dispatch = useDispatch();
  const modulesManager = useModulesManager();
  const classes = useStyles();
  const { formatMessage } = useTranslations("insuree", FAMILY_MEMBERS_HEADERS);

  const familyMembers = useSelector((state) => state.insuree.familyMembers?.filter(member => !member.head));
  const renderLastNameFirst = modulesManager.getConf("fe-insuree", "renderLastNameFirst", true);

  useEffect(() => {
    if (insuree?.family?.uuid) {
      dispatch(fetchFamilyMembers(modulesManager, [`familyUuid: "${insuree.family.uuid}"`]));
    }
  }, [insuree?.family?.uuid]);

  const onDoubleClick = (member, newTab = false) => {
    if (member?.uuid && insuree?.family?.uuid) {
      historyPush(
        modulesManager,
        history,
        "insuree.route.insuree",
        [member.uuid, insuree.family.uuid],
        newTab
      );
    }
  };

  return (
    <Paper className={classes.paper}>
      <TableContainer className={classes.tableContainer}>
        <Table size="small">
          <TableHead>
            <TableRow className={classes.tableHeader}>
              {FAMILY_MEMBERS_HEADERS.map((header) => (
                <TableCell key={header} className={classes.headerCell}>
                  {formatMessage(`insuree.${header}`)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {familyMembers?.length > 0 ? (
              familyMembers.map((familyMember) => (
                <TableRow
                  key={familyMember?.uuid}
                  className={classes.tableRow}
                  onDoubleClick={() => onDoubleClick(familyMember)}
                >
                  <TableCell>{familyMember?.chfId || HYPHEN}</TableCell>
                  <TableCell>
                    {renderLastNameFirst
                      ? `${familyMember?.lastName || ''} ${familyMember?.otherNames || ''}`
                      : `${familyMember?.otherNames || ''} ${familyMember?.lastName || ''}`}
                  </TableCell>
                  <TableCell>{familyMember?.phone || HYPHEN}</TableCell>
                  <TableCell>{familyMember?.gender?.code || HYPHEN}</TableCell>
                  <TableCell>{familyMember?.dob || HYPHEN}</TableCell>
                  <TableCell>{familyMember?.cardIssued ? formatMessage("yes") : formatMessage("no")}</TableCell>
                  <TableCell>
                    {familyMember?.photo ? (
                      <img
                        src={`data:image/jpeg;base64,${familyMember.photo.photo}`}
                        alt=""
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "fill",
                          borderRadius: "80%",
                        }}
                      />
                    ) : (
                      <Typography>{formatMessage("insuree.noPhoto")}</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={FAMILY_MEMBERS_HEADERS.length} align="center">
                  <Typography>{formatMessage("insuree.FamilyMembersTable.noMembers")}</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default FamilyMembersTable;
