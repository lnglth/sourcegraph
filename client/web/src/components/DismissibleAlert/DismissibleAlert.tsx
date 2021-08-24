import classNames from 'classnames'
import CloseIcon from 'mdi-react/CloseIcon'
import * as React from 'react'

import styles from './DismissibleAlert.module.scss'

interface Props {
    /**
     * If provided, used to build the key that represents the alert in local storage. An
     * alert with a storage key will be permanently dismissed once the user dismisses it.
     */
    partialStorageKey?: string

    /** class name to be applied to the alert */
    className: string
}

/**
 * A global site alert that can be dismissed. If a `partialStorageKey` is provided, the
 * alert will never be shown again after it is dismissed. Otherwise, it will be shown
 * whenever unmounted and remounted.
 */
export const DismissibleAlert: React.FunctionComponent<Props> = ({ partialStorageKey, className, children }) => {
    const [dismissed, setDismissed] = React.useState<boolean>(
        partialStorageKey ? isAlertDismissed(partialStorageKey) : false
    )

    const onDismiss = React.useCallback(() => {
        if (partialStorageKey) {
            dismissAlert(partialStorageKey)
        }
        setDismissed(true)
    }, [partialStorageKey])

    if (dismissed) {
        return null
    }
    return (
        <div className={classNames('alert', styles.container, className)}>
            <div className={styles.content}>{children}</div>
            <button type="button" className={classNames('btn btn-icon', styles.closeButton)} onClick={onDismiss}>
                <CloseIcon className="icon-inline" />
            </button>
        </div>
    )
}

export function dismissAlert(key: string): void {
    localStorage.setItem(storageKeyForPartial(key), 'true')
}

export function isAlertDismissed(key: string): boolean {
    return localStorage.getItem(storageKeyForPartial(key)) === 'true'
}

function storageKeyForPartial(partialStorageKey: string): string {
    return `DismissibleAlert/${partialStorageKey}/dismissed`
}
