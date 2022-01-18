import classNames from 'classnames'
import React from 'react'

import { Alert } from '@sourcegraph/wildcard'

import { ErrorMessage } from '../../alerts'

import styles from './ConnectionError.module.scss'

interface ConnectionErrorProps {
    errors: string[]
    compact?: boolean
}

/**
 * Renders FilteredConnection styled errors
 */
export const ConnectionError: React.FunctionComponent<ConnectionErrorProps> = ({ errors, compact }) => (
    <Alert className={classNames(compact && styles.compact)} variant="danger">
        {errors.map((error, index) => (
            <React.Fragment key={index}>
                <ErrorMessage error={error} />
            </React.Fragment>
        ))}
    </Alert>
)
