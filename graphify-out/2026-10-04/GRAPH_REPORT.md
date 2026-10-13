# Graph Report - frontend  (2026-10-02)

## Corpus Check
- 242 files · ~158,648 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1931 nodes · 4659 edges · 118 communities (91 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- routeTree.gen.ts
- article.ts
- devDependencies
- dependencies
- McpSection.tsx
- WidgetRuntimeContext.tsx
- GuidanceContentEditor.tsx
- job.ts
- compilerOptions
- utils.ts
- widget.ts
- articleContent.ts
- contentReferences.ts
- TrainTestAgentPanel.tsx
- ProjectSidebar.tsx
- PlansAdminForm.tsx
- ProjectSectionPlaceholder.tsx
- utils.ts
- HomeCanvasRenderer.tsx
- brandingContext.tsx
- GuidanceSection.tsx
- FileRoutesByPath
- ApiKeysSection.tsx
- WidgetBuilder.tsx
- components.json
- UsersAdminForm.tsx
- SandboxChatForm.tsx
- SandboxOcrForm.tsx
- TranslateLanguageCombobox.tsx
- Building For Production
- TopicRichEditor.tsx
- ui-classes.ts
- authContext.tsx
- agent.ts
- cn
- VariableReferencePicker.tsx
- ToggleRow.tsx
- planContext.tsx
- quillTopicRef.ts
- command.tsx
- WidgetApp.tsx
- ArticleDrawer.tsx
- index.tsx
- route.tsx
- chat.tsx
- HomeCanvasBuilder.tsx
- WidgetArticleReader.tsx
- JsonTemplateBuilder.tsx
- SideDrawer.tsx
- HomeChromeUploads.tsx
- router.tsx
- reset-password.tsx
- article.tsx
- guidance.tsx
- widget.tsx
- jobs.tsx
- plans.tsx
- route.tsx
- login.tsx
- register.tsx
- index.tsx
- mcp.tsx
- route.tsx
- route.tsx
- $publicKey.tsx
- AGENTS.md
- prettier.config.js
- vite.config.ts
- route.tsx
- WidgetChatAgent.tsx
- usePlan
- FaqArticlePicker.tsx
- $slug.tsx
- visitor-jwt.md
- ApiKeysSection.tsx
- useAnalyzeDateRange.ts
- DocsMarkdown.tsx
- Configure Your Client Backend
- Security Guidelines
- suggestNextBreak
- SnippetDrawer.tsx
- Developer Docs
- Configure Visitor JWT in SapAi
- scripts
- HostWidgetEmbed.tsx
- quillPasteImages.ts
- README.md
- reset-password.tsx
- widget.tsx
- app-config.tsx
- MetricCard.tsx
- plans.tsx
- PriorityMeter.tsx
- index.tsx
- register.tsx
- route.tsx
- route.tsx
- quillPasteImages.ts
- route.tsx
- ui.tsx
- TrustBar.tsx
- route.tsx
- login.tsx
- gaps.tsx
- route.tsx
- mermaid
- radix-ui
- react
- react-day-picker
- react-dom
- react-quill-new
- socket.io-client
- @tanstack/react-devtools
- @tanstack/react-router
- @tanstack/react-router-devtools
- zod

## God Nodes (most connected - your core abstractions)
1. `cn()` - 314 edges
2. `apiFetch()` - 125 edges
3. `FileRoutesByPath` - 48 edges
4. `usePlan()` - 29 edges
5. `parseContentToBlocks()` - 25 edges
6. `serializeContentBlocks()` - 24 edges
7. `getToken()` - 21 edges
8. `useAuth()` - 21 edges
9. `pageHead()` - 20 edges
10. `WidgetApp()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `toUtcDatetimeLocalValue()` --indirect_call--> `n()`  [INFERRED]
  src/lib/adminUser.ts → public/widget.js
- `ScrollLogoStory()` --indirect_call--> `i()`  [INFERRED]
  src/components/home/ScrollLogoStory.tsx → public/widget.js
- `mergeMeetings()` --indirect_call--> `m()`  [INFERRED]
  src/components/meetingTool/MeetingToolSection.tsx → public/widget.js
- `UtcDateTimePicker()` --indirect_call--> `m()`  [INFERRED]
  src/components/ui/utc-datetime-picker.tsx → public/widget.js
- `UtcDateTimePicker()` --indirect_call--> `h()`  [INFERRED]
  src/components/ui/utc-datetime-picker.tsx → public/widget.js

## Import Cycles
- None detected.

## Communities (118 total, 27 thin omitted)

### Community 0 - "routeTree.gen.ts"
Cohesion: 0.03
Nodes (68): Route, AdminAppConfigRoute, AdminIndexRoute, AdminPlansRoute, AdminRouteRoute, AdminRouteRouteChildren, AdminRouteRouteWithChildren, AdminUsersIndexRoute (+60 more)

### Community 1 - "article.ts"
Cohesion: 0.05
Nodes (67): ArticleDrawerProps, StatusPill(), SyncPill(), ArticlesSection(), ArticlesSectionProps, ArticlesSkeleton(), IconAction(), rollupSyncStatus() (+59 more)

### Community 2 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, devDependencies, eslint, prettier, @tailwindcss/typography, @tanstack/devtools-vite, @tanstack/eslint-config, @tanstack/router-cli (+19 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (27): class-variance-authority, clsx, cmdk, date-fns, lucide-react, marked, dependencies, class-variance-authority (+19 more)

### Community 4 - "McpSection.tsx"
Cohesion: 0.13
Nodes (24): AUTH_TYPE_LABELS, IconAction(), McpSection(), McpSectionProps, McpSkeleton(), StatusPill(), SyncStatusPill(), TRANSPORT_LABELS (+16 more)

### Community 5 - "WidgetRuntimeContext.tsx"
Cohesion: 0.07
Nodes (36): ArticleViewState, ChatView, NewsViewState, useWidgetRuntime(), WidgetPanelSettings, WidgetRuntimeContext, WidgetRuntimeContextValue, WidgetRuntimeProviderProps (+28 more)

### Community 6 - "GuidanceContentEditor.tsx"
Cohesion: 0.09
Nodes (37): d(), COMMON_TIMEZONES, dateFromYmd(), MeetingTopicDrawer(), MeetingTopicDrawerProps, pad2(), StatusPill(), ymdFromDate() (+29 more)

### Community 7 - "job.ts"
Cohesion: 0.11
Nodes (28): embedWidgetPath(), isVisitorTokenRequestMessage(), isWidgetCommandMessage(), isWidgetCorner(), isWidgetFrameMessage(), isWidgetHostEnvMessage(), VISITOR_TOKEN_REQUEST_MESSAGE_TYPE, VisitorTokenMessage (+20 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, eslint.config.js, prettier.config.js, **/*.ts, **/*.tsx, vite/client (+19 more)

### Community 9 - "utils.ts"
Cohesion: 0.17
Nodes (18): AnalyzeGapsSection(), AnalyzeGapsSectionProps, emptyGapsMessage(), gapGroupCount(), GapsDrill, GapsSkeleton(), RESOLVED_FILTERS, ResolvedFilter (+10 more)

### Community 10 - "widget.ts"
Cohesion: 0.07
Nodes (33): embeddingHost(), ButtonTextAlign, CreateVisitorJwtResult, defaultChatSettings(), getPublicWidget(), HOME_SECTION_TYPE_VALUES, HomeCanvasElement, HomeElementType (+25 more)

### Community 11 - "articleContent.ts"
Cohesion: 0.11
Nodes (29): ToolChip(), escapeAttr(), sanitizeArticleHtml(), topicBodyHtml(), WidgetArticleReader(), WidgetArticleReaderProps, TopicEditorBlock, TopicImageBlock (+21 more)

### Community 12 - "contentReferences.ts"
Cohesion: 0.13
Nodes (24): reconcileSavePayloadWithEditorDelta(), applyVarBindings(), ContentBlock, defaultToolAlias(), hasTopicRef(), ImageBlock, listToolDeclarations(), listToolVariables() (+16 more)

### Community 13 - "TrainTestAgentPanel.tsx"
Cohesion: 0.16
Nodes (17): AgentInfluenceArticle, AgentInfluenceChunk, AgentInfluenceDeclaredTool, AgentInfluenceGuidance, AgentInfluenceTool, AgentInfluenceTopic, AgentSseEvent, emptyAgentInfluence() (+9 more)

### Community 14 - "ProjectSidebar.tsx"
Cohesion: 0.14
Nodes (20): isGroupActive(), isNavLinkActive(), navGroupButtonClass, NavGroupItem(), navLinkClass, NavLinkItem(), ProjectMobileDrawer(), ProjectSidebar() (+12 more)

### Community 15 - "PlansAdminForm.tsx"
Cohesion: 0.15
Nodes (22): formatMessageTime(), LiveAgentDashboard(), LiveAgentDashboardProps, statusBadgeClass(), StatusFilter, waitingLabel(), agentFetch(), claimAgentTicket() (+14 more)

### Community 16 - "ProjectSectionPlaceholder.tsx"
Cohesion: 0.17
Nodes (5): ProjectSectionPlaceholder(), ProjectSectionPlaceholderProps, Route, Route, Route

### Community 17 - "utils.ts"
Cohesion: 0.13
Nodes (19): AnalyzeOverviewSection(), AnalyzeOverviewSectionProps, commentText(), CsatBlock(), RatingPreview(), RatingReviews(), STAR_FILTERS, starBucket() (+11 more)

### Community 18 - "HomeCanvasRenderer.tsx"
Cohesion: 0.22
Nodes (12): UiTemplateSample, uiTemplateSamples, dataTableTemplateDefinition, keyFactsTemplateDefinition, mediaCaptionTemplateDefinition, paymentQrTemplateDefinition, statsOverviewTemplateDefinition, uiDescSchema (+4 more)

### Community 19 - "brandingContext.tsx"
Cohesion: 0.09
Nodes (25): BrandMark(), BrandMarkProps, BrandMarkSize, SIZE, Footer(), FOOTER_COLUMNS, FooterLink, AppConfigData (+17 more)

### Community 20 - "GuidanceSection.tsx"
Cohesion: 0.14
Nodes (16): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), Dialog() (+8 more)

### Community 21 - "FileRoutesByPath"
Cohesion: 0.23
Nodes (12): TopicChip(), formatTopicRef(), insertTopicRefAt(), buildTopicChipElement(), DeltaLike, DeltaOp, fillChip(), plainTextToDeltaOps() (+4 more)

### Community 22 - "ApiKeysSection.tsx"
Cohesion: 0.20
Nodes (19): IconAction(), LiveAgentSection(), LiveAgentSectionProps, StatusPill(), createLiveAgent(), deleteLiveAgent(), getLiveAgentSettings(), listLiveAgents() (+11 more)

### Community 23 - "WidgetBuilder.tsx"
Cohesion: 0.16
Nodes (24): WidgetRuntimeProvider(), usePublicWidgetLoad(), WidgetApp(), WidgetAppProps, draftFromWidget(), WidgetBuilder(), DefaultBadgeIcon(), WidgetEmbedShell() (+16 more)

### Community 24 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "UsersAdminForm.tsx"
Cohesion: 0.12
Nodes (28): AnalyzePerformanceSection(), AnalyzePerformanceSectionProps, OPTION_SECTIONS, OptionDimension, OptionEditor(), PerformanceSkeleton(), RecordsDrill, ANALYTICS_GAP_TYPES (+20 more)

### Community 26 - "SandboxChatForm.tsx"
Cohesion: 0.12
Nodes (23): VariableChip(), applyRefChipStatus(), DeltaCtor, DeltaLike, DeltaOp, fillToolChip(), fillVariableChip(), hydrateContentRefsInEditor() (+15 more)

### Community 27 - "SandboxOcrForm.tsx"
Cohesion: 0.19
Nodes (16): PickerTool, ToolReferencePicker(), ToolReferencePickerProps, schemaFieldPaths(), VariableOption, VariableReferencePicker(), VariableReferencePickerProps, Modal() (+8 more)

### Community 28 - "TranslateLanguageCombobox.tsx"
Cohesion: 0.11
Nodes (18): LoginForm(), LoginFormProps, LoginResponse, PasswordInput(), PasswordInputProps, RegisterForm(), RegisterFormProps, RegisterResponse (+10 more)

### Community 29 - "Building For Production"
Cohesion: 0.17
Nodes (12): Adding A Route, Adding Links, API Routes, Building For Production, Data Fetching, Linting & Formatting, Removing Tailwind CSS, Routing (+4 more)

### Community 30 - "TopicRichEditor.tsx"
Cohesion: 0.11
Nodes (28): normalizeRender(), RENDER_LABELS, templateRoot(), ToolUiConfig(), ToolUiRenderMode, Select(), SelectContent(), SelectItem() (+20 more)

### Community 31 - "ui-classes.ts"
Cohesion: 0.15
Nodes (16): HomeSections(), HomeSectionsProps, sectionCardClass(), SectionContent(), sectionCardClass(), WidgetFaqList(), WidgetFaqListProps, WidgetNewsCard() (+8 more)

### Community 32 - "authContext.tsx"
Cohesion: 0.17
Nodes (16): AuthContext, AuthContextValue, AuthProvider(), AuthUser, bootstrapAuth(), clearToken(), fetchValidatedUser(), getToken() (+8 more)

### Community 33 - "agent.ts"
Cohesion: 0.20
Nodes (15): AnalyzeDateRangeProps, dateFromYmd(), DayPickerField(), formatYmd(), ymdFromLocalDate(), Popover(), PopoverContent(), PopoverTrigger() (+7 more)

### Community 34 - "cn"
Cohesion: 0.08
Nodes (37): allowBlobImageSrc(), NewsRichEditor(), NewsRichEditorProps, QuillEditorApi, QuillProps, ReactQuillHandle, TOOLBAR, Draft (+29 more)

### Community 35 - "VariableReferencePicker.tsx"
Cohesion: 0.18
Nodes (21): cn(), CHART_COLORS, ChartPie(), ChartSeries, mediaSrc(), STATUS_STYLES, UiButtonGroup(), UiCard() (+13 more)

### Community 36 - "ToggleRow.tsx"
Cohesion: 0.10
Nodes (27): c(), f(), h(), i(), l(), m(), n(), r() (+19 more)

### Community 37 - "planContext.tsx"
Cohesion: 0.21
Nodes (9): FIELD_HELP, HelpKey, PlansAdminForm(), ToggleRow(), emptyPlanForm(), formValuesToPayload(), Plan, PlanFormValues (+1 more)

### Community 38 - "quillTopicRef.ts"
Cohesion: 0.07
Nodes (17): Route, Route, Route, Route, Route, Route, projectRouteApi, Route (+9 more)

### Community 39 - "command.tsx"
Cohesion: 0.24
Nodes (17): MeetingByDateView(), MeetingByDateViewProps, MeetingCalendarView(), MeetingCalendarViewProps, MeetingRow(), MeetingRowProps, addDaysYmd(), attendeeSummary() (+9 more)

### Community 40 - "WidgetApp.tsx"
Cohesion: 0.18
Nodes (19): ApplySessionFn, SessionState, usePublicWidgetSession(), UsePublicWidgetSessionOptions, readQueryVisitorToken(), useVisitorTokenBridge(), UseVisitorTokenBridgeOptions, bindPublicVisitorIdentity() (+11 more)

### Community 41 - "ArticleDrawer.tsx"
Cohesion: 0.20
Nodes (14): GuidanceDrawer(), GuidanceDrawerProps, StatusPill(), GuidanceSection(), GuidanceSectionProps, GuidanceSkeleton(), IconAction(), StatusPill() (+6 more)

### Community 42 - "index.tsx"
Cohesion: 0.24
Nodes (6): CAPABILITIES, EmbedShowcase(), STEPS, FinalCta(), HeroSection(), Route

### Community 43 - "route.tsx"
Cohesion: 0.12
Nodes (16): bindStr, buttonGroupSchema, chartSchema, chartSeriesItemSchema, chartVariants, dividerSchema, keyValueSchema, mediaSchema (+8 more)

### Community 44 - "chat.tsx"
Cohesion: 0.14
Nodes (18): appendPendingPurchase(), buildSegments(), formatUtcShort(), isDashedKind(), MapSegment, PendingPurchasePreview, PlanTimelineMap(), PlanTimelineMapProps (+10 more)

### Community 45 - "HomeCanvasBuilder.tsx"
Cohesion: 0.07
Nodes (34): BUILDER_TABS, BuilderTab, BuilderTabMeta, WIDGET_TAB_META, WidgetTabMeta, WidgetTab, ToggleRow(), ToggleRowProps (+26 more)

### Community 46 - "WidgetArticleReader.tsx"
Cohesion: 0.06
Nodes (65): stripUiMarkers(), createAuthImageRenderer(), ANSWERABILITY_FILTERS, AnswerabilityChip(), AnswerabilityFilter, BatchTestSection(), BatchTestSectionProps, ChipDot() (+57 more)

### Community 47 - "JsonTemplateBuilder.tsx"
Cohesion: 0.31
Nodes (9): agentMarkdownToHtml(), agentProseClassName(), AgentMessageBody(), AuthAgentChatImage(), PublicAgentChatImage(), AuthImage(), fetchArticleMediaObjectUrl(), widgetPublicArticleMediaPath() (+1 more)

### Community 48 - "SideDrawer.tsx"
Cohesion: 0.28
Nodes (8): BODY_SIZE, lockBodyScroll(), PANEL_SIZE, PANEL_SIZE_WITH_DETAILS, SideDrawer(), SideDrawerProps, SideDrawerSize, unlockBodyScroll()

### Community 49 - "HomeChromeUploads.tsx"
Cohesion: 0.20
Nodes (12): ProjectSettings(), ProjectSettingsProps, RetrievalModeBadge(), SettingsSection(), parseIpAllowlist(), CollaborationInvite, createCollaborationInvite(), InviteRedirectParams (+4 more)

### Community 50 - "router.tsx"
Cohesion: 0.16
Nodes (13): MeetingListViewProps, MeetingToolSection(), MeetingToolSectionProps, mergeMeetings(), UPCOMING_VIEWS, UpcomingView, calendarMonthRange(), isUpcoming() (+5 more)

### Community 51 - "reset-password.tsx"
Cohesion: 0.30
Nodes (14): addDaysYmd(), dateToYmd(), dowForYmd(), isWeeklyOpenDay(), monthBounds(), pad2(), parseYmd(), slotChipLabel() (+6 more)

### Community 52 - "article.tsx"
Cohesion: 0.15
Nodes (9): getRouter(), Register, @tanstack/react-router, Register, routeTree, allowlistCache, CachedAllowlist, embedFramePolicy (+1 more)

### Community 53 - "guidance.tsx"
Cohesion: 0.17
Nodes (12): Application claims, Claims Are Context, Not Authorization, Clock Skew, Good Patterns, Keep claims small, Login example, Registered claims, Reminting Tokens (+4 more)

### Community 54 - "widget.tsx"
Cohesion: 0.29
Nodes (10): newAgentChatMessageId(), createPublicImageRenderer(), useAgentChatThread(), greetingText(), WidgetChatAgent(), WidgetChatAgentProps, LiveAgentOffer, streamPublicWidgetChat() (+2 more)

### Community 55 - "jobs.tsx"
Cohesion: 0.16
Nodes (11): FeatureShowcase(), RECENT_ACTIVITY, Button(), buttonVariants, Calendar(), CalendarDayButton(), WidgetRatingPrompt(), WidgetRatingPromptProps (+3 more)

### Community 56 - "plans.tsx"
Cohesion: 0.22
Nodes (8): ConversationDrawer(), ConversationDrawerProps, FieldHelp, AnalyticsCategory, ChatAnalyticsConversation, ChatAnalyticsConversationMessage, getChatAnalyticsConversation(), listAnalyticsCategories()

### Community 57 - "route.tsx"
Cohesion: 0.27
Nodes (8): sanitizeHtml(), defaultCode, DocsMarkdown(), DocsMarkdownProps, docsMarkdownToHtml(), docsProseClassName, docsRenderer, rewriteDocLinks()

### Community 58 - "login.tsx"
Cohesion: 0.20
Nodes (13): AnalyticsExplorer(), AnalyticsExplorerProps, formatShortDate(), SparklineRow(), toVolumeTiles(), VolumeTile, layoutTreemap(), TILE_COLORS (+5 more)

### Community 59 - "register.tsx"
Cohesion: 0.15
Nodes (19): formatTimeToFirst(), InfluenceDetails(), InfluenceSection(), SessionState, TrainTestAgentPanel(), TrainTestAgentPanelProps, HostWidgetEmbed(), HostWidgetEmbedProps (+11 more)

### Community 60 - "index.tsx"
Cohesion: 0.16
Nodes (20): planExpiryLabel(), UsersAdminForm(), AdminUser, AdminUserDetail, AdminUserList, AdminUserProject, fromUtcDatetimeLocalValue(), PlanPeriodGap (+12 more)

### Community 61 - "mcp.tsx"
Cohesion: 0.18
Nodes (11): Allowed domains, Checklist, Contents, Embedding the Widget, How it works, Install, Next step, Optional controls (+3 more)

### Community 63 - "route.tsx"
Cohesion: 0.50
Nodes (3): ArticleSearch, Route, TrainArticlesPage()

### Community 64 - "$publicKey.tsx"
Cohesion: 0.13
Nodes (13): blankUiTemplateDefinition, builderInputClassName, CHART_VARIANTS, CHILD_NODE_TYPES, ChildNodeType, ChildrenEditor(), createNode(), NODE_META (+5 more)

### Community 69 - "route.tsx"
Cohesion: 0.22
Nodes (7): LiveAgentAvatar(), LiveAgentAvatarProps, sizeClass, LiveAgentDrawer(), LiveAgentDrawerProps, StatusPill(), LiveAgent

### Community 70 - "WidgetChatAgent.tsx"
Cohesion: 0.16
Nodes (12): AgentChatThread(), AgentChatThreadProps, AgentChatImageRenderer, AgentChatErrorHandling, AgentChatMessage, AgentChatStreamFn, AgentChatStreamResultExtras, UseAgentChatThreadOptions (+4 more)

### Community 71 - "usePlan"
Cohesion: 0.22
Nodes (8): imports, name, pnpm, onlyBuiltDependencies, private, type, esbuild, lightningcss

### Community 72 - "FaqArticlePicker.tsx"
Cohesion: 0.10
Nodes (21): WidgetFormSection(), WidgetFormSectionProps, WidgetHomeForm(), WidgetHomeFormProps, ElementInspector(), ElementInspectorProps, ElementPalette(), ElementPaletteProps (+13 more)

### Community 73 - "$slug.tsx"
Cohesion: 0.43
Nodes (4): DOC_PAGES, DocPage, getDocBySlug(), Route

### Community 74 - "visitor-jwt.md"
Cohesion: 0.22
Nodes (7): Contents, Embed the SapAi Widget, How Visitor JWT Works, Integration Overview, Troubleshooting, Visitor Context in the Agent and MCP, Visitor JWT   Identity & Page Context

### Community 75 - "ApiKeysSection.tsx"
Cohesion: 0.17
Nodes (18): McpDrawer(), McpDrawerProps, parseSchemaProperties(), SchemaProperty, schemaTypeLabel(), StatusPill(), SyncStatusPill(), ToolSchemaDetails() (+10 more)

### Community 76 - "useAnalyzeDateRange.ts"
Cohesion: 0.42
Nodes (8): readStoredRange(), storageKey(), useAnalyzeDateRange(), writeStoredRange(), clampYmdRange(), isoRangeFromYmd(), lookbackBoundsYmd(), utcYmd()

### Community 78 - "Configure Your Client Backend"
Cohesion: 0.25
Nodes (8): Configure Your Client Backend, Create a Visitor JWT endpoint, Create the Visitor JWT, Generate a signing key pair, Node.js example, Option 1: Generate an RSA key pair online, Option 2: Generate keys with OpenSSL, Required claims

### Community 79 - "Security Guidelines"
Cohesion: 0.25
Nodes (8): Do not pass your primary authentication token, Do not put secrets in claims, Enforce authorization separately, Keep the private key private, Keep tokens short-lived, Minimize claims, Security Guidelines, Use HTTPS

### Community 81 - "SnippetDrawer.tsx"
Cohesion: 0.50
Nodes (3): DrawerDetails(), DrawerDetailsProps, formatRelativeTime()

### Community 82 - "Developer Docs"
Cohesion: 0.40
Nodes (5): Developer Docs, Guides, Integration Flow, Next Step, Who These Docs Are For

### Community 83 - "Configure Visitor JWT in SapAi"
Cohesion: 0.40
Nodes (5): 1. Choose the signing algorithm, 2. Configure the issuer, 3. Configure the public key, 4. Configure the audience, Configure Visitor JWT in SapAi

### Community 84 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:loader, check, dev, format, generate-routes, lint (+1 more)

### Community 86 - "quillPasteImages.ts"
Cohesion: 0.10
Nodes (30): allowBlobImageSrc(), chipIconHtml(), escapeHtmlText(), QuillEditorApi, QuillProps, ReactQuillHandle, ReadOnlyBlocks(), SelectedImage (+22 more)

### Community 87 - "README.md"
Cohesion: 0.40
Nodes (4): Demo files, Getting Started, Learn More, Payments (local)

### Community 88 - "reset-password.tsx"
Cohesion: 0.33
Nodes (7): ApiKeysSection(), ApiKeysSkeleton(), isOwner(), ProjectKeyCard(), statusBadgeClass(), CreatedApiKey, getDashboardOverview()

### Community 89 - "widget.tsx"
Cohesion: 0.39
Nodes (7): ProjectCollaborators(), ProjectCollaboratorsProps, ApiKeyCollaborator, CollaboratorPermissions, listCollaborators(), removeCollaborator(), updateCollaboratorPermissions()

### Community 91 - "MetricCard.tsx"
Cohesion: 0.36
Nodes (7): ApiKeyStatus, formatApiKeyStatusLabel(), formatIpAllowlistSummary(), ProjectDashboardPage(), projectRouteApi, Route, statusBadgeClass()

### Community 93 - "PriorityMeter.tsx"
Cohesion: 0.47
Nodes (5): arcPath(), polar(), PriorityMeter(), PriorityMeterProps, TRACK

### Community 94 - "index.tsx"
Cohesion: 0.16
Nodes (23): PlanExpiryBanner(), readHideUntil(), usePlan(), formatUtcDate(), UTC_MONTHS, downloadInvoicePdf(), formatIdr(), Invoice (+15 more)

### Community 95 - "register.tsx"
Cohesion: 0.07
Nodes (17): DOCS_INDEX_MARKDOWN, absoluteUrl(), formatTitle(), LinkEntry, MetaEntry, pageHead(), PageHeadOptions, SITE_URL (+9 more)

### Community 97 - "route.tsx"
Cohesion: 0.33
Nodes (4): ApiKey, ProjectLayoutError(), ProjectLayoutPending(), Route

### Community 98 - "quillPasteImages.ts"
Cohesion: 0.60
Nodes (4): attachPastedImageIngest(), isExternalOrClipboardImageSrc(), needsPastedImageIngest(), PasteImageEditor

### Community 103 - "login.tsx"
Cohesion: 0.15
Nodes (7): bootstrapLiveAgentAuth(), clearAgentToken(), loginLiveAgent(), setAgentToken(), validateLiveAgentSession(), Route, Route

## Knowledge Gaps
- **544 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+539 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report**    run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `VariableReferencePicker.tsx` to `article.ts`, `McpSection.tsx`, `WidgetRuntimeContext.tsx`, `GuidanceContentEditor.tsx`, `utils.ts`, `articleContent.ts`, `ProjectSidebar.tsx`, `PlansAdminForm.tsx`, `ProjectSectionPlaceholder.tsx`, `utils.ts`, `brandingContext.tsx`, `GuidanceSection.tsx`, `FileRoutesByPath`, `ApiKeysSection.tsx`, `WidgetBuilder.tsx`, `UsersAdminForm.tsx`, `SandboxChatForm.tsx`, `SandboxOcrForm.tsx`, `TranslateLanguageCombobox.tsx`, `TopicRichEditor.tsx`, `ui-classes.ts`, `authContext.tsx`, `agent.ts`, `cn`, `planContext.tsx`, `command.tsx`, `ArticleDrawer.tsx`, `chat.tsx`, `HomeCanvasBuilder.tsx`, `WidgetArticleReader.tsx`, `JsonTemplateBuilder.tsx`, `SideDrawer.tsx`, `HomeChromeUploads.tsx`, `router.tsx`, `reset-password.tsx`, `widget.tsx`, `jobs.tsx`, `plans.tsx`, `route.tsx`, `login.tsx`, `register.tsx`, `index.tsx`, `route.tsx`, `$publicKey.tsx`, `route.tsx`, `WidgetChatAgent.tsx`, `FaqArticlePicker.tsx`, `ApiKeysSection.tsx`, `SnippetDrawer.tsx`, `quillPasteImages.ts`, `reset-password.tsx`, `widget.tsx`, `MetricCard.tsx`, `PriorityMeter.tsx`, `index.tsx`, `route.tsx`?**
  _High betweenness centrality (0.405) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dependencies`, `jobs.tsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `CalendarDayButton()` connect `jobs.tsx` to `VariableReferencePicker.tsx`, `react`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _544 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routeTree.gen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.029411764705882353 - nodes in this community are weakly interconnected._
- **Should `article.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05290490100616683 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._