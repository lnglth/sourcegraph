import * as React from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import { LayoutProps } from './Layout'
import { parseSearchURLQuery } from './search'
import { lazyComponent } from './util/lazyComponent'
import { isErrorLike } from '../../shared/src/util/errors'

const SearchPage = lazyComponent(() => import('./search/input/SearchPage'), 'SearchPage')
const SearchResults = lazyComponent(() => import('./search/results/SearchResults'), 'SearchResults')
const SiteAdminArea = lazyComponent(() => import('./site-admin/SiteAdminArea'), 'SiteAdminArea')
const ExtensionsArea = lazyComponent(() => import('./extensions/ExtensionsArea'), 'ExtensionsArea')

export interface LayoutRouteComponentProps extends RouteComponentProps<any>, LayoutProps {}

export interface LayoutRouteProps {
    path: string
    exact?: boolean
    render: (props: LayoutRouteComponentProps) => React.ReactNode

    /**
     * Whether or not to force the width of the page to be narrow.
     */
    forceNarrowWidth?: boolean
}

/**
 * Holds properties for repository+ routes.
 */
export const repoRevRoute: LayoutRouteProps = {
    path: '/:repoRevAndRest+',
    render: lazyComponent(() => import('./repo/RepoContainer'), 'RepoContainer'),
}

function dotStarFromSettings(props: any): boolean {
    // The initial setting for the .* toggle button is based on search.version setting, defaulting to V0.
    const psf = props.settingsCascade.final
    const searchVersion = (psf && !isErrorLike(psf) && psf['search.version']) || 'V0'
    return searchVersion == 'V0'
}

/**
 * Holds all top-level routes for the app because both the navbar and the main content area need to
 * switch over matched path.
 *
 * See https://reacttraining.com/react-router/web/example/sidebar
 */
export const routes: readonly LayoutRouteProps[] = [
    {
        path: '/',
        render: (props: any) =>
            window.context.sourcegraphDotComMode && !props.user ? (
                <Redirect to="https://about.sourcegraph.com" />
            ) : (
                <Redirect to="/search" />
            ),
        exact: true,
    },
    {
        path: '/search',
        render: (props: any) =>
            parseSearchURLQuery(props.location.search) ? (
                // TODO(ijt): get dotStar from the v parameter in props.location.search (0 => true, 1 => false)
                <SearchResults {...props} deployType={window.context.deployType} dotStar={dotStarFromSettings(props)} />
            ) : (
                <SearchPage {...props} dotStar={dotStarFromSettings(props)} />
            ),
        exact: true,
    },
    {
        path: '/search/searches',
        render: lazyComponent(
            () => import('./savedSearches/RedirectToUserSavedSearches'),
            'RedirectToUserSavedSearches'
        ),
        exact: true,
        forceNarrowWidth: true,
    },
    {
        path: '/open',
        render: lazyComponent(() => import('./open/OpenPage'), 'OpenPage'),
        exact: true,
        forceNarrowWidth: true,
    },
    {
        path: '/sign-in',
        render: lazyComponent(() => import('./auth/SignInPage'), 'SignInPage'),
        exact: true,
        forceNarrowWidth: true,
    },
    {
        path: '/sign-up',
        render: lazyComponent(() => import('./auth/SignUpPage'), 'SignUpPage'),
        exact: true,
        forceNarrowWidth: true,
    },
    {
        path: '/settings',
        render: lazyComponent(() => import('./user/settings/RedirectToUserSettings'), 'RedirectToUserSettings'),
    },
    {
        path: '/user',
        render: lazyComponent(() => import('./user/settings/RedirectToUserPage'), 'RedirectToUserPage'),
    },
    {
        path: '/organizations',
        render: lazyComponent(() => import('./org/OrgsArea'), 'OrgsArea'),
    },
    {
        path: '/search',
        render: (props: any) => (
            <SearchResults {...props} deployType={window.context.deployType} dotStar={dotStarFromSettings(props)} />
        ),
        exact: true,
    },
    {
        path: '/site-admin/init',
        exact: true,
        render: lazyComponent(() => import('./site-admin/SiteInitPage'), 'SiteInitPage'),
        forceNarrowWidth: false,
    },
    {
        path: '/site-admin',
        render: props => (
            <SiteAdminArea
                {...props}
                routes={props.siteAdminAreaRoutes}
                sideBarGroups={props.siteAdminSideBarGroups}
                overviewComponents={props.siteAdminOverviewComponents}
            />
        ),
    },
    {
        path: '/password-reset',
        render: lazyComponent(() => import('./auth/ResetPasswordPage'), 'ResetPasswordPage'),
        exact: true,
        forceNarrowWidth: true,
    },
    {
        path: '/explore',
        render: lazyComponent(() => import('./explore/ExploreArea'), 'ExploreArea'),
        exact: true,
    },
    {
        path: '/discussions',
        render: lazyComponent(() => import('./discussions/DiscussionsPage'), 'DiscussionsPage'),
        exact: true,
    },
    {
        path: '/search/scope/:id',
        render: lazyComponent(() => import('./search/input/ScopePage'), 'ScopePage'),
        exact: true,
    },
    {
        path: '/api/console',
        render: lazyComponent(() => import('./api/APIConsole'), 'APIConsole'),
        exact: true,
    },
    {
        path: '/users/:username',
        render: lazyComponent(() => import('./user/area/UserArea'), 'UserArea'),
    },
    {
        path: '/survey/:score?',
        render: lazyComponent(() => import('./marketing/SurveyPage'), 'SurveyPage'),
    },
    {
        path: '/extensions',
        render: props => <ExtensionsArea {...props} routes={props.extensionsAreaRoutes} />,
    },
    {
        path: '/help',
        render: () => {
            // Force a hard reload so that we delegate to the HTTP handler for /help, which handles
            // redirecting /help to https://docs.sourcegraph.com. That logic is not duplicated in
            // the web app because that would add complexity with no user benefit.
            //
            // TODO(sqs): This currently has a bug in dev mode where you can't go back to the app
            // after following the redirect. This will be fixed when we run docsite on
            // http://localhost:5080 in Procfile because then the redirect will be cross-domain and
            // won't reuse the same history stack.
            window.location.reload()
            return null
        },
    },
    {
        path: '/snippets',
        render: lazyComponent(() => import('./snippets/SnippetsPage'), 'SnippetsPage'),
    },
    repoRevRoute,
]
