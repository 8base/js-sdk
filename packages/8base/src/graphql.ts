export const USER_LOGIN_MUTATION = `
  mutation UserLoginMutation($data: UserLoginInput!) {
    userLogin(data: $data) {
      success
      auth {
        idToken
        refreshToken
      }
    }
  }
`;

export const USER_SIGN_UP_MUTATION = `
  mutation UserSignUpMutation($authProfileId: ID!, $password: String!, $user: UserCreateInput!) {
    userSignUpWithPassword(
      authProfileId: $authProfileId,
      password: $password,
      user: $user
    ) {
      id
      email
      firstName
      lastName
      timezone
      status
    }
  }
`;

export const USER_SIGN_UP_WITH_TOKEN_MUTATION = `
  mutation UserSignUpWithTokenMutation($authProfileId: ID!, $user: UserCreateInput!) {
    userSignUpWithToken(
      authProfileId: $authProfileId,
      user: $user
    ) {
      id
      email
      firstName
      lastName
      timezone
      status
    }
  }
`;

export const CURRENT_USER_QUERY = `
  query {
    user {
      id
      email
      firstName
      lastName
      timezone
      avatar {
        downloadUrl
      }
    }
  }
`;
