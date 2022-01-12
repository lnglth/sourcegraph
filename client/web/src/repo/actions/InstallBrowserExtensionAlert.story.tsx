import { action } from '@storybook/addon-actions'
import { storiesOf } from '@storybook/react'
import React from 'react'

import { ExternalServiceKind } from '@sourcegraph/shared/src/graphql/schema'

import { WebStory } from '../../components/WebStory'

import { InstallBrowserExtensionAlert } from './InstallBrowserExtensionAlert'

const onAlertDismissed = action('onAlertDismissed')

const { add } = storiesOf('web/repo/actions/InstallBrowserExtensionAlert', module).addDecorator(story => (
    <div className="container mt-3">{story()}</div>
))

// Disable Chromatic for the non-GitHub alerts since they are mostly the same

const services = [
    ExternalServiceKind.GITHUB,
    ExternalServiceKind.GITLAB,
    ExternalServiceKind.PHABRICATOR,
    ExternalServiceKind.BITBUCKETSERVER,
] as const

for (const serviceKind of services) {
    add(
        `${serviceKind} (native integration installed)`,
        () => (
            <WebStory>
                {() => (
                    <InstallBrowserExtensionAlert
                        onAlertDismissed={onAlertDismissed}
                        codeHostIntegrationMessaging="native-integration"
                        externalURLs={[
                            {
                                url: '',
                                serviceKind,
                            },
                        ]}
                    />
                )}
            </WebStory>
        ),
        {
            chromatic: {
                disable: serviceKind !== ExternalServiceKind.GITHUB,
            },
        }
    )

    add(
        `${serviceKind} (browser)`,
        () => (
            <WebStory>
                {() => (
                    <InstallBrowserExtensionAlert
                        onAlertDismissed={onAlertDismissed}
                        codeHostIntegrationMessaging="browser-extension"
                        externalURLs={[
                            {
                                url: '',
                                serviceKind,
                            },
                        ]}
                    />
                )}
            </WebStory>
        ),
        {
            chromatic: {
                disable: serviceKind !== ExternalServiceKind.GITHUB,
            },
        }
    )
}
