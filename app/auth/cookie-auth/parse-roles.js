export const parseRoles = (rolesToParse) => {
  const roleNames = [];
  const roles = rolesToParse.map((x) => {
    const parseRoles = x.split(":");
    roleNames.push(parseRoles[1]);
    return {
      relationshipId: parseRoles[0],
      roleName: parseRoles[1],
      status: parseRoles[2],
    };
  });

  return { roles, roleNames };
};
