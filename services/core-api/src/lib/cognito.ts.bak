import { Amplify } from 'aws-amplify';
import { signIn, signOut, signUp, confirmSignUp, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export interface AuthConfig {
  userPoolId: string;
  userPoolClientId: string;
  region?: string;
}

export function configureAuth(config: AuthConfig) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        signUpVerificationMethod: 'code',
        loginWith: {
          email: true
        }
      }
    }
  });
}

export async function signInUser(email: string, password: string): Promise<any> {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password
    });
    return { isSignedIn, nextStep };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signUpUser(email: string, password: string, attributes: Record<string, string>): Promise<any> {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: attributes
      }
    });
    return { isSignUpComplete, userId, nextStep };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

export async function confirmSignUpUser(email: string, code: string): Promise<any> {
  try {
    const { isSignUpComplete, nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: code
    });
    return { isSignUpComplete, nextStep };
  } catch (error) {
    console.error('Confirm sign up error:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function getCurrentUserInfo(): Promise<any> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    return {
      user,
      idToken: session.tokens?.idToken?.toString(),
      accessToken: session.tokens?.accessToken?.toString()
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function getIdToken(): Promise<string | undefined> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  } catch (error) {
    console.error('Get ID token error:', error);
    return undefined;
  }
}