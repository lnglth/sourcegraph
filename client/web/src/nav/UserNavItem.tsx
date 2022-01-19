import { Shortcut } from '@slimsag/react-shortcuts'
import classNames from 'classnames'
import * as H from 'history'
import ChevronDownIcon from 'mdi-react/ChevronDownIcon'
import ChevronUpIcon from 'mdi-react/ChevronUpIcon'
import OpenInNewIcon from 'mdi-react/OpenInNewIcon'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tooltip } from 'reactstrap'

import { KeyboardShortcut } from '@sourcegraph/shared/src/keyboardShortcuts'
import { ThemeProps } from '@sourcegraph/shared/src/theme'
import {
    Menu,
    MenuButton,
    MenuDivider,
    MenuHeader,
    MenuItems,
    MenuPopover,
    useTimeoutManager,
    MenuLink,
    useOpenMenuButton,
} from '@sourcegraph/wildcard'

import { AuthenticatedUser } from '../auth'
import { KEYBOARD_SHORTCUT_SHOW_HELP } from '../keyboardShortcuts/keyboardShortcuts'
import { ThemePreference } from '../stores/themeState'
import { ThemePreferenceProps } from '../theme'
import { UserAvatar } from '../user/UserAvatar'

import styles from './UserNavItem.module.scss'

export interface UserNavItemProps extends ThemeProps, ThemePreferenceProps, ExtensionAlertAnimationProps {
    location: H.Location
    authenticatedUser: Pick<
        AuthenticatedUser,
        'username' | 'avatarURL' | 'settingsURL' | 'organizations' | 'siteAdmin' | 'session' | 'displayName'
    >
    showDotComMarketing: boolean
    keyboardShortcutForSwitchTheme?: KeyboardShortcut
    testIsOpen?: boolean
    codeHostIntegrationMessaging: 'browser-extension' | 'native-integration'
    showRepositorySection?: boolean
}

export interface ExtensionAlertAnimationProps {
    isExtensionAlertAnimating: boolean
}

/**
 * React hook to manage the animation that occurs after the user dismisses
 * `InstallBrowserExtensionAlert`.
 *
 * This hook is called from the the LCA of `UserNavItem` and the component that triggers
 * the animation.
 */
export function useExtensionAlertAnimation(): ExtensionAlertAnimationProps & {
    startExtensionAlertAnimation: () => void
} {
    const [isAnimating, setIsAnimating] = useState(false)

    const animationManager = useTimeoutManager()

    const startExtensionAlertAnimation = useCallback(() => {
        if (!isAnimating) {
            setIsAnimating(true)

            animationManager.setTimeout(() => {
                setIsAnimating(false)
            }, 5100)
        }
    }, [isAnimating, animationManager])

    return { isExtensionAlertAnimating: isAnimating, startExtensionAlertAnimation }
}

/**
 * Triggers Keyboard Shortcut help when the button is clicked in the Menu Nav item
 */

const showKeyboardShortcutsHelp = (): void => {
    const keybinding = KEYBOARD_SHORTCUT_SHOW_HELP.keybindings[0]
    const shiftKey = !!keybinding.held?.includes('Shift')
    const altKey = !!keybinding.held?.includes('Alt')
    const metaKey = !!keybinding.held?.includes('Meta')
    const ctrlKey = !!keybinding.held?.includes('Control')

    for (const key of keybinding.ordered) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, metaKey, ctrlKey, altKey }))
    }
}

/**
 * Displays the user's avatar and/or username in the navbar and exposes a dropdown menu with more options for
 * authenticated viewers.
 */
export const UserNavItem: React.FunctionComponent<UserNavItemProps> = props => {
    const {
        location,
        themePreference,
        onThemePreferenceChange,
        isExtensionAlertAnimating,
        testIsOpen,
        codeHostIntegrationMessaging,
    } = props

    const supportsSystemTheme = useMemo(
        () => Boolean(window.matchMedia?.('not all and (prefers-color-scheme), (prefers-color-scheme)').matches),
        []
    )
    const menuButtonReference = useRef<HTMLButtonElement>(null)
    const { setIsDropdownOpen } = useOpenMenuButton(menuButtonReference)

    useEffect(() => {
        // Close dropdown after clicking on a dropdown item.
        if (!testIsOpen) {
            setIsDropdownOpen(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, testIsOpen])

    const onThemeChange: React.ChangeEventHandler<HTMLSelectElement> = useCallback(
        event => {
            onThemePreferenceChange(event.target.value as ThemePreference)
        },
        [onThemePreferenceChange]
    )

    const onThemeCycle = useCallback((): void => {
        onThemePreferenceChange(themePreference === ThemePreference.Dark ? ThemePreference.Light : ThemePreference.Dark)
    }, [onThemePreferenceChange, themePreference])

    // Target ID for tooltip
    const targetID = 'target-user-avatar'

    return (
        <Menu>
            {({ isExpanded }) => (
                <>
                    <MenuButton className="bg-transparent d-flex align-items-center test-user-nav-item-toggle">
                        <div className="position-relative">
                            <div className="align-items-center d-flex">
                                <UserAvatar
                                    user={props.authenticatedUser}
                                    targetID={targetID}
                                    className={classNames('icon-inline', styles.avatar)}
                                />
                                {isExpanded ? (
                                    <ChevronUpIcon className="icon-inline" />
                                ) : (
                                    <ChevronDownIcon className="icon-inline" />
                                )}
                            </div>
                        </div>
                        {isExtensionAlertAnimating && (
                            <Tooltip
                                target={targetID}
                                placement="bottom"
                                isOpen={true}
                                modifiers={{
                                    offset: {
                                        offset: '0, 10px',
                                    },
                                }}
                                className={styles.tooltip}
                            >
                                Install the browser extension from here later
                            </Tooltip>
                        )}
                    </MenuButton>
                    <MenuPopover className="py-0" aria-label="User. Open menu">
                        <MenuItems className={styles.dropdownMenu}>
                            <MenuHeader className="py-1">
                                Signed in as <strong>@{props.authenticatedUser.username}</strong>
                            </MenuHeader>
                            <MenuDivider />
                            <MenuLink as={Link} to={props.authenticatedUser.settingsURL!}>
                                Settings
                            </MenuLink>
                            {props.showRepositorySection && (
                                <MenuLink
                                    as={Link}
                                    to={`/users/${props.authenticatedUser.username}/settings/repositories`}
                                >
                                    Your repositories
                                </MenuLink>
                            )}
                            <MenuLink as={Link} to={`/users/${props.authenticatedUser.username}/searches`}>
                                Saved searches
                            </MenuLink>
                            <MenuDivider />
                            <div className="px-2 py-1">
                                <div className="d-flex align-items-center">
                                    <div className="mr-2">Theme</div>
                                    <select
                                        className="custom-select custom-select-sm test-theme-toggle"
                                        onChange={onThemeChange}
                                        value={props.themePreference}
                                    >
                                        <option value={ThemePreference.Light}>Light</option>
                                        <option value={ThemePreference.Dark}>Dark</option>
                                        <option value={ThemePreference.System}>System</option>
                                    </select>
                                </div>
                                {props.themePreference === ThemePreference.System && !supportsSystemTheme && (
                                    <div className="text-wrap">
                                        <small>
                                            <a
                                                href="https://caniuse.com/#feat=prefers-color-scheme"
                                                className="text-warning"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Your browser does not support the system theme.
                                            </a>
                                        </small>
                                    </div>
                                )}
                                {props.keyboardShortcutForSwitchTheme?.keybindings.map((keybinding, index) => (
                                    <Shortcut key={index} {...keybinding} onMatch={onThemeCycle} />
                                ))}
                            </div>
                            {props.authenticatedUser.organizations.nodes.length > 0 && (
                                <>
                                    <MenuDivider />
                                    <MenuHeader>Your organizations</MenuHeader>
                                    {props.authenticatedUser.organizations.nodes.map(org => (
                                        <MenuLink as={Link} key={org.id} to={org.settingsURL || org.url}>
                                            {org.displayName || org.name}
                                        </MenuLink>
                                    ))}
                                </>
                            )}
                            <MenuDivider />
                            {props.authenticatedUser.siteAdmin && (
                                <MenuLink as={Link} to="/site-admin">
                                    Site admin
                                </MenuLink>
                            )}
                            <MenuLink as={Link} to="/help" target="_blank" rel="noopener">
                                Help <OpenInNewIcon className="icon-inline" />
                            </MenuLink>
                            <MenuLink as="button" onClick={showKeyboardShortcutsHelp} type="button">
                                Keyboard shortcuts
                            </MenuLink>

                            {props.authenticatedUser.session?.canSignOut && (
                                <MenuLink href="/-/sign-out">Sign out</MenuLink>
                            )}
                            <MenuDivider />
                            {props.showDotComMarketing && (
                                <MenuLink href="https://about.sourcegraph.com" target="_blank" rel="noopener">
                                    About Sourcegraph <OpenInNewIcon className="icon-inline" />
                                </MenuLink>
                            )}
                            {codeHostIntegrationMessaging === 'browser-extension' && (
                                <MenuLink
                                    href="https://docs.sourcegraph.com/integration/browser_extension"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    Browser extension <OpenInNewIcon className="icon-inline" />
                                </MenuLink>
                            )}
                        </MenuItems>
                    </MenuPopover>
                </>
            )}
        </Menu>
    )
}
