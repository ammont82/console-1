/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { PageSection } from '@patternfly/react-core'
import { AcmAlert, AcmCountCard, AcmExpandableWrapper } from '../../../../ui-components'
import { Fragment, useCallback, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from '../../../../lib/acm-i18next'
import { SavedSearch, UserPreference } from '../../../../resources/userpreference'
import { convertStringToQuery } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultCountQuery } from '../search-sdk/search-sdk'
import { updateBrowserUrl } from '../urlQuery'
import { DeleteSearchModal } from './Modals/DeleteSearchModal'
import { SaveAndEditSearchModal } from './Modals/SaveAndEditSearchModal'
import { ShareSearchModal } from './Modals/ShareSearchModal'
import SuggestQueryTemplates from './SuggestedQueryTemplates'

export default function SavedSearchQueries(props: {
    savedSearches: SavedSearch[]
    setSelectedSearch: React.Dispatch<React.SetStateAction<string>>
    userPreference?: UserPreference
}) {
    const { savedSearches, setSelectedSearch, userPreference } = props
    const { t } = useTranslation()
    const history = useHistory()
    const [editSavedSearch, setEditSavedSearch] = useState<SavedSearch | undefined>(undefined)
    const [shareSearch, setShareSearch] = useState<SavedSearch | undefined>(undefined)
    const [deleteSearch, setDeleteSearch] = useState<SavedSearch | undefined>(undefined)

    const suggestedQueryTemplates = SuggestQueryTemplates?.templates ?? ([] as SavedSearch[])
    // combine the suggested queries and saved queries
    const input = [
        ...savedSearches.map((query) => convertStringToQuery(query.searchText)),
        ...suggestedQueryTemplates.map((query: { searchText: string }) => convertStringToQuery(query.searchText)),
    ]
    const { data, error, loading } = useSearchResultCountQuery({
        variables: { input: input },
        client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    })

    const handleKeyPress = useCallback(
        (KeyboardEvent: React.KeyboardEvent, query: SavedSearch) => {
            if (KeyboardEvent.key === 'Enter' || KeyboardEvent.key === ' ') {
                updateBrowserUrl(history, query.searchText)
                setSelectedSearch(query.name)
            }
        },
        [history, setSelectedSearch]
    )

    if (loading) {
        return (
            <PageSection>
                <AcmExpandableWrapper withCount={false} expandable={false}>
                    <AcmCountCard loading />
                    <AcmCountCard loading />
                    <AcmCountCard loading />
                </AcmExpandableWrapper>
            </PageSection>
        )
    } else if (error) {
        return (
            <PageSection>
                <AcmAlert
                    noClose={true}
                    variant={'danger'}
                    isInline={true}
                    title={t('Query error related to saved search results.')}
                    subtitle={error ? error.message : ''}
                />
            </PageSection>
        )
    } else if (!loading && !error && (!data || !data.searchResult)) {
        return <Fragment />
    } else {
        return (
            <PageSection>
                {editSavedSearch && (
                    <SaveAndEditSearchModal
                        setSelectedSearch={setSelectedSearch}
                        savedSearch={editSavedSearch}
                        onClose={() => setEditSavedSearch(undefined)}
                        savedSearchQueries={savedSearches}
                        userPreference={userPreference}
                    />
                )}
                {shareSearch && (
                    <ShareSearchModal shareSearch={shareSearch} onClose={() => setShareSearch(undefined)} />
                )}
                {deleteSearch && (
                    <DeleteSearchModal
                        onClose={() => setDeleteSearch(undefined)}
                        searchToDelete={deleteSearch}
                        userPreference={userPreference}
                    />
                )}

                {savedSearches.length > 0 && (
                    <AcmExpandableWrapper
                        maxHeight={'16.5rem'}
                        headerLabel={t('Saved searches')}
                        withCount={true}
                        expandable={true}
                    >
                        {savedSearches.map((savedSearch, index) => {
                            return (
                                <AcmCountCard
                                    key={parseInt(savedSearch.id)}
                                    cardHeader={{
                                        hasIcon: false,
                                        title: savedSearch.name,
                                        description: savedSearch.description ?? '',
                                        actions: [
                                            {
                                                text: t('Edit'),
                                                handleAction: () => setEditSavedSearch(savedSearch),
                                            },
                                            {
                                                text: t('Share'),
                                                handleAction: () => setShareSearch(savedSearch),
                                            },
                                            {
                                                text: t('Delete'),
                                                handleAction: () => setDeleteSearch(savedSearch),
                                            },
                                        ],
                                    }}
                                    onCardClick={() => {
                                        updateBrowserUrl(history, savedSearch.searchText)
                                        setSelectedSearch(savedSearch.name)
                                    }}
                                    count={data?.searchResult?.[index]?.count ?? 0}
                                    countTitle={t('Results')}
                                    onKeyPress={(KeyboardEvent: React.KeyboardEvent) =>
                                        handleKeyPress(KeyboardEvent, savedSearch)
                                    }
                                />
                            )
                        })}
                    </AcmExpandableWrapper>
                )}
                <AcmExpandableWrapper
                    headerLabel={t('Suggested search templates')}
                    withCount={false}
                    expandable={false}
                >
                    {suggestedQueryTemplates.map((query, index) => {
                        return (
                            <AcmCountCard
                                key={parseInt(query.id)}
                                cardHeader={{
                                    hasIcon: true,
                                    title: query.name,
                                    description: query.description,
                                    actions: [
                                        {
                                            text: t('Share'),
                                            handleAction: () => setShareSearch(query),
                                        },
                                    ],
                                }}
                                onCardClick={() => {
                                    updateBrowserUrl(history, query.searchText)
                                }}
                                count={data?.searchResult?.[index]?.count ?? 0}
                                countTitle={t('Results')}
                                onKeyPress={(KeyboardEvent: React.KeyboardEvent) =>
                                    handleKeyPress(KeyboardEvent, query)
                                }
                            />
                        )
                    })}
                </AcmExpandableWrapper>
            </PageSection>
        )
    }
}
