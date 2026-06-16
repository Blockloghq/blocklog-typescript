import {
  BlocklogSDK,
  canManageMembers,
  canManageTeam,
  isTeamOwner,
} from '../src';

async function main() {
  const sdk = new BlocklogSDK({
    endpoint: process.env.BLOCKLOG_ENDPOINT ?? 'http://127.0.0.1:8000/api/v1',
    timeout: 10_000,
    debug: true,
  });

  const signup = await sdk.auth.signup({
    username: 'jane',
    email: 'jane@example.com',
    password: 'ChangeMe123!',
    workspace_name: 'Acme Security',
  });

  sdk.setAccessToken(signup.token);

  console.log('Created team:', signup.team.name);
  console.log('User is owner:', isTeamOwner(signup.team, signup.user.user_id));

  if (canManageTeam(signup.team, signup.user.user_id)) {
    await sdk.teams.update(signup.team.id, {
      default_sla_minutes: 30,
      description: 'Primary incident response team',
    });
  }

  const members = await sdk.teams.members.list(signup.team.id);
  const firstMember = members[0];
  if (firstMember && canManageMembers(firstMember)) {
    console.log('Primary member has elevated team permissions');
  }

  const notificationResult = await sdk.teams.notifyTest(signup.team.id);
  console.log('Notification test:', notificationResult.results);
}

void main();
