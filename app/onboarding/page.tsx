'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '../../lib/actions/onboarding.actions'
import { auth } from '@clerk/nextjs/server'
import OnboardingComponent from '../../components/onboarding'

const OnboardingPage = () => {
    const { user } = useUser()

    return <OnboardingComponent name={user?.firstName || ""} />
}

export default OnboardingPage