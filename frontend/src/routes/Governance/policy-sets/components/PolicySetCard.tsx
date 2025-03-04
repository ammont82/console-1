/* Copyright Contributors to the Open Cluster Management project */

import {
    Alert,
    Button,
    Card,
    CardActions,
    CardBody,
    CardHeader,
    CardTitle,
    Checkbox,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Dropdown,
    DropdownItem,
    DropdownSeparator,
    KebabToggle,
    Modal,
    ModalVariant,
    Stack,
    StackItem,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { AcmDrawerContext, AcmDrawerProps } from '../../../../ui-components'
import { ReactNode, useCallback, useContext, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { placementBindingsState, placementRulesState, placementsState } from '../../../../atoms'
import { useTranslation } from '../../../../lib/acm-i18next'
import { deletePolicySet } from '../../../../lib/delete-policyset'
import { NavigationPath } from '../../../../NavigationPath'
import { PolicySet } from '../../../../resources'
import { PolicySetDetailSidebar } from '../components/PolicySetDetailSidebar'

export default function PolicySetCard(props: {
    policySet: PolicySet
    selectedCardID: string
    setSelectedCardID: React.Dispatch<React.SetStateAction<string>>
    canEditPolicySet: boolean
    canDeletePolicySet: boolean
}) {
    const { policySet, selectedCardID, setSelectedCardID, canEditPolicySet, canDeletePolicySet } = props
    const { t } = useTranslation()
    const { setDrawerContext } = useContext(AcmDrawerContext)
    const [isKebabOpen, setIsKebabOpen] = useState<boolean>(false)
    const [modal, setModal] = useState<ReactNode | undefined>()
    const history = useHistory()
    const cardID = `policyset-${policySet.metadata.namespace}-${policySet.metadata.name}`

    function onClick(cardId: string) {
        setDrawerContext({
            isExpanded: true,
            onCloseClick: () => {
                setDrawerContext(undefined)
                setSelectedCardID('')
            },
            title: (
                <Stack>
                    {policySet.metadata.name}
                    <div style={{ fontSize: 'smaller', opacity: 0.6, fontWeight: 'normal' }}>
                        {`Namespace: ${policySet.metadata.namespace}`}
                    </div>
                </Stack>
            ),
            panelContent: <PolicySetDetailSidebar policySet={policySet} />,
            panelContentProps: { defaultSize: '40%' },
            isInline: true,
            isResizable: true,
        })
        // Introduce a delay (400ms) until scroll to selected card to wait for sidebar to transition.
        setTimeout(() => {
            const cardElement = document.querySelector(`#${cardId}`)
            cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        }, 400)
    }

    function onToggle(
        isOpen: boolean,
        event: MouseEvent | KeyboardEvent | React.KeyboardEvent<any> | React.MouseEvent<HTMLButtonElement>
    ) {
        event.stopPropagation()
        setIsKebabOpen(isOpen)
    }

    function onSelectOverflow(event?: React.SyntheticEvent<HTMLDivElement>) {
        event?.stopPropagation()
        setIsKebabOpen(false)
    }

    return (
        <div>
            {modal !== undefined && modal}
            <Card
                isRounded
                isHoverable
                isFullHeight
                isSelectable
                isSelected={selectedCardID === cardID}
                id={cardID}
                key={cardID}
                style={{ transition: 'box-shadow 0.25s', cursor: 'pointer' }}
                onClick={(event) => {
                    const newSelectedCard = cardID === selectedCardID ? '' : cardID
                    setSelectedCardID(newSelectedCard)
                    if (!event.currentTarget.contains(event.target as Node)) {
                        return
                    }
                    onClick(cardID)
                }}
            >
                <CardHeader isToggleRightAligned={true}>
                    <CardActions>
                        <Dropdown
                            onSelect={onSelectOverflow}
                            toggle={<KebabToggle onToggle={onToggle} />}
                            isOpen={isKebabOpen}
                            isPlain
                            dropdownItems={[
                                <DropdownItem
                                    key="view details"
                                    onClick={() => {
                                        const newSelectedCard = cardID === selectedCardID ? '' : cardID
                                        setSelectedCardID(newSelectedCard)
                                        onClick(cardID)
                                    }}
                                >
                                    {t('View details')}
                                </DropdownItem>,
                                <DropdownItem
                                    isAriaDisabled={!canEditPolicySet}
                                    tooltip={!canEditPolicySet ? t('rbac.unauthorized') : ''}
                                    key="edit"
                                    onClick={() => {
                                        history.push(
                                            NavigationPath.editPolicySet
                                                .replace(':namespace', policySet.metadata.namespace)
                                                .replace(':name', policySet.metadata.name)
                                        )
                                    }}
                                >
                                    {t('Edit')}
                                </DropdownItem>,
                                <DropdownSeparator key="separator" />,
                                <DropdownItem
                                    isAriaDisabled={!canDeletePolicySet}
                                    tooltip={!canDeletePolicySet ? t('rbac.unauthorized') : ''}
                                    key="delete"
                                    onClick={() => {
                                        setIsKebabOpen(false)
                                        setModal(
                                            <DeletePolicySetModal
                                                item={policySet}
                                                onClose={() => setModal(undefined)}
                                                setDrawerContext={setDrawerContext}
                                                setSelectedCardID={setSelectedCardID}
                                            />
                                        )
                                    }}
                                >
                                    {t('Delete')}
                                </DropdownItem>,
                            ]}
                            position={'right'}
                        />
                    </CardActions>
                    <CardTitle>
                        <Stack>
                            {policySet.metadata.name}
                            <div style={{ fontSize: 'smaller', opacity: 0.6, fontWeight: 'normal' }}>
                                {`Namespace: ${policySet.metadata.namespace}`}
                            </div>
                        </Stack>
                    </CardTitle>
                </CardHeader>
                <CardBody>
                    <Stack hasGutter>
                        {policySet.spec.description && <div>{policySet.spec.description ?? ''}</div>}
                        <DescriptionList>
                            {(policySet.status?.compliant || policySet.status?.statusMessage) && (
                                <DescriptionListGroup>
                                    <DescriptionListTerm>
                                        <strong>{t('Status')}</strong>
                                    </DescriptionListTerm>
                                    {policySet.status?.compliant && (
                                        <DescriptionListDescription>
                                            {policySet.status?.compliant === 'Compliant' ? (
                                                <div>
                                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" />{' '}
                                                    &nbsp;
                                                    {t('No violations')}
                                                </div>
                                            ) : (
                                                <div>
                                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" />{' '}
                                                    &nbsp;
                                                    {t('Violations')}
                                                </div>
                                            )}
                                        </DescriptionListDescription>
                                    )}
                                    {policySet.status?.statusMessage && (
                                        <div>
                                            {policySet.status?.statusMessage.split(';').map((statusMes) => (
                                                <DescriptionListDescription>{statusMes}</DescriptionListDescription>
                                            ))}
                                        </div>
                                    )}
                                </DescriptionListGroup>
                            )}
                        </DescriptionList>
                    </Stack>
                </CardBody>
            </Card>
        </div>
    )
}

function DeletePolicySetModal(props: {
    item: PolicySet
    onClose: () => void
    setDrawerContext: React.Dispatch<React.SetStateAction<AcmDrawerProps | undefined>>
    setSelectedCardID: React.Dispatch<React.SetStateAction<string>>
}) {
    const { t } = useTranslation()
    const [deletePlacements, setDeletePlacements] = useState(true)
    const [deletePlacementBindings, setDeletePlacementBindings] = useState(true)
    const [placements] = useRecoilState(placementsState)
    const [placementRules] = useRecoilState(placementRulesState)
    const [placementBindings] = useRecoilState(placementBindingsState)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState('')
    const onConfirm = useCallback(async () => {
        setIsDeleting(true)
        try {
            setError('')
            await deletePolicySet(
                props.item,
                placements,
                placementRules,
                placementBindings,
                deletePlacements,
                deletePlacementBindings
            ).promise
            props.onClose()
            setIsDeleting(false)
            props.setDrawerContext(undefined)
            props.setSelectedCardID('')
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError(t('Unknown error occured'))
            }
            setIsDeleting(false)
        }
    }, [props, placements, placementRules, placementBindings, deletePlacements, deletePlacementBindings, t])
    return (
        <Modal
            title={t('Permanently delete {{type}} {{name}}?', {
                type: props.item.kind,
                name: '',
            })}
            titleIconVariant={'warning'}
            isOpen
            onClose={props.onClose}
            actions={[
                <Button key="confirm" variant="danger" onClick={onConfirm} isLoading={isDeleting}>
                    {isDeleting ? t('deleting') : t('delete')}
                </Button>,
                <Button key="cancel" variant="link" onClick={props.onClose}>
                    {t('Cancel')}
                </Button>,
            ]}
            variant={ModalVariant.medium}
        >
            <Stack hasGutter>
                <StackItem>
                    {t(`Removing ${props.item.metadata.name} is irreversible. Select any associated resources that need to be
            deleted in addition to ${props.item.metadata.name}.`)}
                </StackItem>
                <StackItem>
                    <Checkbox
                        id="delete-placement-bindings"
                        isChecked={deletePlacementBindings}
                        onChange={setDeletePlacementBindings}
                        label={t('policy.modal.delete.associatedResources.placementBinding')}
                    />
                </StackItem>
                <StackItem>
                    <Checkbox
                        id="delete-placements"
                        isChecked={deletePlacements}
                        onChange={setDeletePlacements}
                        label={t('policy.modal.delete.associatedResources.placement')}
                    />
                </StackItem>
                {error && (
                    <StackItem>
                        <Alert variant="danger" title={error} isInline />
                    </StackItem>
                )}
            </Stack>
        </Modal>
    )
}
