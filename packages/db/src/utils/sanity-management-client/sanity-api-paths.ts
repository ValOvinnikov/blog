export const SANITY_API_PATH = {
  projects: () => '/projects',
  project: (projectId: string) => `/projects/${projectId}`,
  projectDatasets: (projectId: string) => `/projects/${projectId}/datasets`,
  projectDataset: (projectId: string, dataset: string) =>
    `/projects/${projectId}/datasets/${dataset}`,
  projectCors: (projectId: string) => `/projects/${projectId}/cors`,
  projectAcl: (projectId: string) => `/projects/${projectId}/acl/`,
  projectAclEntry: (projectId: string, projectUserId: string) =>
    `/projects/${projectId}/acl/${projectUserId}`,
  projectInvites: (projectId: string) => `/access/project/${projectId}/invites`,
  projectInvitesPendingOrAccepted: (projectId: string) =>
    `/access/project/${projectId}/invites?status=pending&status=accepted`,
  projectInvite: (projectId: string, inviteId: string) =>
    `/access/project/${projectId}/invites/${inviteId}`,
  projectUsers: (projectId: string) => `/access/project/${projectId}/users`,
  projectUserRole: (projectId: string, sanityUserId: string, role: string) =>
    `/access/project/${projectId}/users/${sanityUserId}/roles/${role}`,
  organizationUsers: (organizationId: string) =>
    `/access/organization/${organizationId}/users`,
  projectRobots: (projectId: string) => `/access/project/${projectId}/robots`,
  projectRobot: (projectId: string, robotId: string) =>
    `/access/project/${projectId}/robots/${robotId}`,
  projectWebhooks: (projectId: string) => `/hooks/projects/${projectId}`,
} as const;
