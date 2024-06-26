<script context="module" lang="ts">
    function queryHasTypeFilter(query: string): boolean {
        const tokens = scanSearchQuery(query)
        if (tokens.type !== 'success') {
            return false
        }
        const filters = tokens.term.filter((token): token is QueryFilter => token.type === 'filter')
        return filters.some(filter => filter.field.value === 'type')
    }

    function inferOperatingSystem(userAgent: string): 'Windows' | 'MacOS' | 'Linux' | undefined {
        if (userAgent.includes('Win')) {
            return 'Windows'
        }

        if (userAgent.includes('Mac')) {
            return 'MacOS'
        }

        if (userAgent.includes('Linux')) {
            return 'Linux'
        }

        return undefined
    }
</script>

<script lang="ts">
    import { onMount } from 'svelte'

    import type { Filter as QueryFilter } from '@sourcegraph/shared/src/search/query/token'

    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import { getGraphQLClient } from '$lib/graphql'
    import Icon from '$lib/Icon.svelte'
    import ArrowBendIcon from '$lib/icons/ArrowBend.svelte'
    import LanguageIcon from '$lib/LanguageIcon.svelte'
    import Popover from '$lib/Popover.svelte'
    import RepoPopover, { fetchRepoPopoverData } from '$lib/repo/RepoPopover/RepoPopover.svelte'
    import CodeHostIcon from '$lib/search/CodeHostIcon.svelte'
    import SymbolKindIcon from '$lib/search/SymbolKindIcon.svelte'
    import { displayRepoName, scanSearchQuery, type Filter } from '$lib/shared'
    import { SVELTE_LOGGER, SVELTE_TELEMETRY_EVENTS } from '$lib/telemetry'
    import { TELEMETRY_V2_RECORDER } from '$lib/telemetry2'
    import { TELEMETRY_V2_FILTER_TYPES } from '@sourcegraph/shared/src/search/stream'
    import { delay } from '$lib/utils'
    import { Alert } from '$lib/wildcard'
    import Button from '$lib/wildcard/Button.svelte'

    import HelpFooter from './HelpFooter.svelte'
    import {
        type URLQueryFilter,
        type SectionItemData,
        staticTypeFilters,
        typeFilterIcons,
        groupFilters,
        moveFiltersToQuery,
        resetFilters,
    } from './index'
    import LoadingSkeleton from './LoadingSkeleton.svelte'
    import Section from './Section.svelte'
    import SectionItem from './SectionItem.svelte'

    export let searchQuery: string
    export let streamFilters: Filter[]
    export let selectedFilters: URLQueryFilter[]
    export let state: 'complete' | 'error' | 'loading'

    $: groupedFilters = groupFilters(streamFilters, selectedFilters)
    $: typeFilters = staticTypeFilters.map((staticTypeFilter): SectionItemData => {
        const selectedOrStreamFilter = groupedFilters.type.find(
            typeFilter => typeFilter.label === staticTypeFilter.label
        )
        return {
            ...staticTypeFilter,
            count: selectedOrStreamFilter?.count,
            exhaustive: selectedOrStreamFilter?.exhaustive || false,
            selected: selectedOrStreamFilter?.selected || false,
        }
    })

    $: resetModifier = inferOperatingSystem(navigator.userAgent) === 'MacOS' ? '⌥' : 'Alt'
    $: resetURL = resetFilters($page.url).toString()
    $: enableReset = selectedFilters.length > 0

    function handleResetKeydown(event: KeyboardEvent) {
        if (enableReset && event.altKey && event.key === 'Backspace') {
            goto(resetURL)
        }
    }

    function handleFilterSelect(kind: SectionItemData['kind']): void {
        SVELTE_LOGGER.log(SVELTE_TELEMETRY_EVENTS.SelectSearchFilter, { kind }, { kind })
        TELEMETRY_V2_RECORDER.recordEvent('search.filters', 'select', {
            metadata: { filterKind: TELEMETRY_V2_FILTER_TYPES[kind] },
        })
    }

    onMount(() => {
        window.addEventListener('keydown', handleResetKeydown)
        return () => window.removeEventListener('keydown', handleResetKeydown)
    })
</script>

<aside class="sidebar">
    <div class="scroll-container">
        <div class="header">
            <h3>Filter results</h3>
            {#if enableReset}
                <a href={resetURL}>
                    <small>Reset all <kbd>{resetModifier} ⌫</kbd></small>
                </a>
            {/if}
        </div>

        {#if !queryHasTypeFilter(searchQuery)}
            <Section items={typeFilters} title="By type" showAll onFilterSelect={handleFilterSelect}>
                <svelte:fragment slot="label" let:label>
                    <Icon svgPath={typeFilterIcons[label]} inline aria-hidden="true" />&nbsp;
                    {label}
                </svelte:fragment>
            </Section>
        {/if}

        <Section
            items={groupedFilters.repo}
            title="By repository"
            filterPlaceholder="Filter repositories"
            onFilterSelect={handleFilterSelect}
        >
            <svelte:fragment slot="item" let:item>
                <Popover showOnHover let:registerTrigger placement="right-start">
                    <div use:registerTrigger>
                        <SectionItem {item}>
                            <svelte:fragment slot="label" let:label>
                                <CodeHostIcon disableTooltip repository={label} />
                                <span>{displayRepoName(label)}</span>
                            </svelte:fragment>
                        </SectionItem>
                    </div>
                    <svelte:fragment slot="content">
                        {#await delay(fetchRepoPopoverData(getGraphQLClient(), item.label), 200) then data}
                            <RepoPopover {data} withHeader />
                        {:catch error}
                            <Alert size="slim" variant="danger">{error}</Alert>
                        {/await}
                    </svelte:fragment>
                </Popover>
            </svelte:fragment>
        </Section>
        <Section
            items={groupedFilters.lang}
            title="By language"
            filterPlaceholder="Filter languages"
            onFilterSelect={handleFilterSelect}
        >
            <svelte:fragment slot="label" let:label>
                <LanguageIcon class="icon" language={label} inline />&nbsp;
                {label}
            </svelte:fragment>
        </Section>
        <Section
            items={groupedFilters['symbol type']}
            title="By symbol type"
            filterPlaceholder="Filter symbol types"
            onFilterSelect={handleFilterSelect}
        >
            <svelte:fragment slot="label" let:label>
                <div class="symbol-label">
                    <SymbolKindIcon symbolKind={label.toUpperCase()} />
                    {label}
                </div>
            </svelte:fragment>
        </Section>
        <Section
            items={groupedFilters.author}
            title="By author"
            filterPlaceholder="Filter authors"
            onFilterSelect={handleFilterSelect}
        />
        <Section items={groupedFilters['commit date']} title="By commit date" onFilterSelect={handleFilterSelect}>
            <span class="commit-date-label" slot="label" let:label let:value>
                {label}
                <small><pre>{value}</pre></small>
            </span>
        </Section>
        <Section items={groupedFilters.file} title="By file" showAll onFilterSelect={handleFilterSelect} />
        <Section items={groupedFilters.utility} title="Utility" showAll onFilterSelect={handleFilterSelect} />

        {#if state === 'loading'}
            <LoadingSkeleton />
        {/if}

        <div class="help-footer">
            <HelpFooter />
        </div>
    </div>
    {#if selectedFilters.length > 0}
        <div class="move-button">
            <Button variant="secondary" display="block" outline on:click={() => goto(moveFiltersToQuery($page.url))}>
                <svelte:fragment>
                    Move filters to query&nbsp;
                    <ArrowBendIcon aria-hidden class="arrow-icon" />
                </svelte:fragment>
            </Button>
        </div>
    {/if}
</aside>

<style lang="scss">
    .sidebar {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .scroll-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 1.5rem;
        overflow-y: auto;
        padding-top: 1.25rem;
        background-color: var(--color-bg-1);

        .header {
            display: flex;
            padding: 0 1rem;
            h3 {
                margin: 0;
            }
            a {
                margin-left: auto;
                line-height: 1;
                kbd {
                    // TODO: use this style globally
                    font-family: var(--font-family-base);
                    color: var(--text-muted);
                    background: var(--color-bg-1);
                    box-shadow: inset 0 -2px 0 var(--border-color-2);
                    border: 1px solid var(--border-color-2);
                }
            }
        }

        .help-footer {
            margin-top: auto;
        }
    }

    .move-button {
        margin-top: auto;
        padding: 1rem;
        border-top: 1px solid var(--border-color);
        :global(svg) {
            transform: rotateX(180deg);
            fill: none !important;
            --icon-color: var(--body-color);
        }
    }

    .symbol-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    pre {
        // Overwrites global default
        margin-bottom: 0;
    }
</style>
