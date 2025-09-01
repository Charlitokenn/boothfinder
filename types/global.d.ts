export { }

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            onboardingComplete?: boolean,
            tosConfirm?: boolean,
            mobileNumber?: string,
            dateOfBirth?: string,
        }
    }
}