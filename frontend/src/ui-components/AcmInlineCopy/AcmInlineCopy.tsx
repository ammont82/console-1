/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { CopyIcon } from '@patternfly/react-icons'
import { Popover, ButtonVariant } from '@patternfly/react-core'
import { AcmButton } from '../AcmButton/AcmButton'
import { onCopy } from '../utils'

export function AcmInlineCopy(props: { text: string; id: string; displayText?: string }) {
    const [copied, setCopied] = useState<boolean>(false)
    useEffect(() => {
        /* istanbul ignore if */
        if (copied) {
            setTimeout(() => setCopied(false), 2000)
        }
    }, [copied])
    return (
        <span>
            <Popover bodyContent="" headerContent="Copied!" isVisible={copied} hasAutoWidth showClose={false}>
                <AcmButton
                    id={props.id}
                    variant={ButtonVariant.link}
                    icon={<CopyIcon />}
                    iconPosition="right"
                    isInline
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={(event: any) => {
                        setCopied(true)
                        onCopy(event, props.text)
                    }}
                    aria-label="Copy button"
                >
                    {props.displayText ?? props.text}
                </AcmButton>
            </Popover>
        </span>
    )
}
