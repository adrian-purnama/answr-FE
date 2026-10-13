# Graph Report - frontend  (2026-09-29)

## Corpus Check
- 226 files · ~137,726 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1780 nodes · 4198 edges · 101 communities (79 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.52)
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
- HostWidgetEmbed.tsx
- quillPasteImages.ts
- README.md
- reset-password.tsx
- widget.tsx
- app-config.tsx
- MetricCard.tsx
- plans.tsx
- index.tsx
- register.tsx
- route.tsx
- route.tsx
- ui.tsx
- route.tsx
- login.tsx
- route.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 291 edges
2. `apiFetch()` - 117 edges
3. `FileRoutesByPath` - 46 edges
4. `parseContentToBlocks()` - 25 edges
5. `serializeContentBlocks()` - 24 edges
6. `usePlan()` - 23 edges
7. `useAuth()` - 19 edges
8. `WidgetApp()` - 18 edges
9. `getToken()` - 18 edges
10. `widgetPublicMediaPath()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `ensureFullWeeklySchedule()` --indirect_call--> `d()`  [INFERRED]
  src/lib/meetingTool.ts → public/widget.js
- `mergeMeetings()` --indirect_call--> `m()`  [INFERRED]
  src/components/meetingTool/MeetingToolSection.tsx → public/widget.js
- `CalendarDayButton()` --references--> `react`  [EXTRACTED]
  src/components/ui/calendar.tsx → package.json
- `AgentChatThread()` --calls--> `cn()`  [EXTRACTED]
  src/components/agentChat/AgentChatThread.tsx → src/lib/utils.ts
- `GapsSkeleton()` --calls--> `cn()`  [EXTRACTED]
  src/components/analyze/AnalyzeGapsSection.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (101 total, 22 thin omitted)

### Community 0 - "routeTree.gen.ts"
Cohesion: 0.03
Nodes (64): AdminAppConfigRoute, AdminIndexRoute, AdminPlansRoute, AdminRouteRoute, AdminRouteRouteChildren, AdminRouteRouteWithChildren, AdminUsersIndexRoute, AdminUsersUserIdRoute (+56 more)

### Community 1 - "article.ts"
Cohesion: 0.05
Nodes (67): ArticleDrawerProps, StatusPill(), SyncPill(), ArticlesSection(), ArticlesSectionProps, ArticlesSkeleton(), IconAction(), rollupSyncStatus() (+59 more)

### Community 2 - "devDependencies"
Cohesion: 0.04
Nodes (44): eslint, devDependencies, eslint, prettier, @tailwindcss/typography, @tanstack/devtools-vite, @tanstack/eslint-config, @tanstack/router-cli (+36 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (49): class-variance-authority, clsx, cmdk, date-fns, lucide-react, marked, mermaid, dependencies (+41 more)

### Community 4 - "McpSection.tsx"
Cohesion: 0.13
Nodes (23): AUTH_TYPE_LABELS, IconAction(), McpSection(), McpSectionProps, McpSkeleton(), StatusPill(), SyncStatusPill(), TRANSPORT_LABELS (+15 more)

### Community 5 - "WidgetRuntimeContext.tsx"
Cohesion: 0.09
Nodes (31): newAgentChatMessageId(), createPublicImageRenderer(), useAgentChatThread(), ArticleViewState, ChatView, NewsViewState, useWidgetRuntime(), WidgetPanelSettings (+23 more)

### Community 6 - "GuidanceContentEditor.tsx"
Cohesion: 0.12
Nodes (30): COMMON_TIMEZONES, dateFromYmd(), MeetingTopicDrawer(), MeetingTopicDrawerProps, pad2(), StatusPill(), ymdFromDate(), BuiltinReferenceTool (+22 more)

### Community 7 - "job.ts"
Cohesion: 0.11
Nodes (27): isVisitorTokenRequestMessage(), isWidgetCommandMessage(), isWidgetCorner(), isWidgetFrameMessage(), isWidgetHostEnvMessage(), VISITOR_TOKEN_REQUEST_MESSAGE_TYPE, VisitorTokenMessage, VisitorTokenRequestMessage (+19 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, eslint.config.js, prettier.config.js, **/*.ts, **/*.tsx, vite/client (+19 more)

### Community 9 - "utils.ts"
Cohesion: 0.13
Nodes (23): AnalyzeGapsSection(), AnalyzeGapsSectionProps, emptyGapsMessage(), gapGroupCount(), GapsDrill, GapsSkeleton(), RESOLVED_FILTERS, ResolvedFilter (+15 more)

### Community 10 - "widget.ts"
Cohesion: 0.06
Nodes (38): embeddingHost(), sectionCardClass(), WidgetFaqList(), WidgetFaqListProps, ButtonTextAlign, CreateVisitorJwtResult, getActivePublicLiveAgentTicket(), getPublicWidget() (+30 more)

### Community 11 - "articleContent.ts"
Cohesion: 0.16
Nodes (14): TopicContentSavePayload, TopicEditorBlock, TopicImageBlock, TopicTextBlock, editorBlocksToHtml(), escapeAttr(), htmlToTopicContent(), ImageSrcMeta (+6 more)

### Community 12 - "contentReferences.ts"
Cohesion: 0.12
Nodes (25): reconcileSavePayloadWithEditorDelta(), applyVarBindings(), defaultToolAlias(), formatVarRef(), hasTopicRef(), ImageBlock, insertTopicRefAt(), listToolDeclarations() (+17 more)

### Community 13 - "TrainTestAgentPanel.tsx"
Cohesion: 0.16
Nodes (18): AgentInfluenceArticle, AgentInfluenceChunk, AgentInfluenceDeclaredTool, AgentInfluenceGuidance, AgentInfluenceTool, AgentInfluenceTopic, AgentSseEvent, emptyAgentInfluence() (+10 more)

### Community 14 - "ProjectSidebar.tsx"
Cohesion: 0.06
Nodes (46): ApiKeysSection(), ApiKeysSkeleton(), isOwner(), ProjectKeyCard(), ProjectCollaborators(), ProjectCollaboratorsProps, ProjectSettings(), ProjectSettingsProps (+38 more)

### Community 15 - "PlansAdminForm.tsx"
Cohesion: 0.05
Nodes (68): PickerTool, ToolReferencePicker(), ToolReferencePickerProps, schemaFieldPaths(), VariableOption, VariableReferencePicker(), VariableReferencePickerProps, LiveAgentAvatar() (+60 more)

### Community 16 - "ProjectSectionPlaceholder.tsx"
Cohesion: 0.17
Nodes (5): ProjectSectionPlaceholder(), ProjectSectionPlaceholderProps, Route, Route, Route

### Community 17 - "utils.ts"
Cohesion: 0.15
Nodes (18): AnalyzeOverviewSection(), AnalyzeOverviewSectionProps, commentText(), CsatBlock(), RatingPreview(), RatingReviews(), STAR_FILTERS, starBucket() (+10 more)

### Community 18 - "HomeCanvasRenderer.tsx"
Cohesion: 0.13
Nodes (20): UiTemplateSample, dataTableTemplateDefinition, keyFactsTemplateDefinition, mediaCaptionTemplateDefinition, paymentQrTemplateDefinition, bindStr, buttonGroupSchema, keyValueSchema (+12 more)

### Community 19 - "brandingContext.tsx"
Cohesion: 0.11
Nodes (20): Footer(), FOOTER_COLUMNS, FooterLink, AppConfigData, AppConfigForm(), ToggleRow(), Header(), NAV_LINKS (+12 more)

### Community 20 - "GuidanceSection.tsx"
Cohesion: 0.14
Nodes (16): Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), Dialog() (+8 more)

### Community 21 - "FileRoutesByPath"
Cohesion: 0.19
Nodes (20): chipIconHtml(), escapeHtmlText(), topicContentToDisplayHtml(), TopicChip(), editorHtmlToSavePayload(), attr(), formatImageRef(), formatToolRef() (+12 more)

### Community 22 - "ApiKeysSection.tsx"
Cohesion: 0.12
Nodes (22): FeatureShowcase(), RECENT_ACTIVITY, Select(), SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton() (+14 more)

### Community 23 - "WidgetBuilder.tsx"
Cohesion: 0.15
Nodes (23): WidgetRuntimeProvider(), usePublicWidgetLoad(), WidgetApp(), WidgetAppProps, DefaultBadgeIcon(), WidgetEmbedShell(), WidgetEmbedShellProps, defaultHomeSettings() (+15 more)

### Community 24 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "UsersAdminForm.tsx"
Cohesion: 0.10
Nodes (31): AnalyzePerformanceSection(), AnalyzePerformanceSectionProps, OPTION_SECTIONS, OptionDimension, OptionEditor(), PerformanceSkeleton(), RecordsDrill, ANALYTICS_GAP_TYPES (+23 more)

### Community 26 - "SandboxChatForm.tsx"
Cohesion: 0.09
Nodes (32): GuidanceContentEditorProps, QuillEditorApi, QuillProps, ReactQuillHandle, ReadOnlyContent(), ToolChip(), VariableChip(), ToolInsertPayload (+24 more)

### Community 27 - "SandboxOcrForm.tsx"
Cohesion: 0.25
Nodes (10): PublicAgentChatImage(), escapeAttr(), sanitizeArticleHtml(), topicBodyHtml(), WidgetArticleReader(), WidgetArticleReaderProps, getPublicWidgetArticle(), PublicArticleDetail (+2 more)

### Community 28 - "TranslateLanguageCombobox.tsx"
Cohesion: 0.23
Nodes (7): PasswordInput(), PasswordInputProps, readOnlyInputClassName, ResetPasswordForm(), setAgentToken(), decodeResetToken(), ResetTokenPayload

### Community 29 - "Building For Production"
Cohesion: 0.17
Nodes (12): Adding A Route, Adding Links, API Routes, Building For Production, Data Fetching, Linting & Formatting, Removing Tailwind CSS, Routing (+4 more)

### Community 30 - "TopicRichEditor.tsx"
Cohesion: 0.23
Nodes (13): blankUiTemplateDefinition, EditorMode, stringifyDefinition(), UiTemplatesSection(), createUiTemplate(), CreateUiTemplateInput, deleteUiTemplate(), listUiTemplates() (+5 more)

### Community 31 - "ui-classes.ts"
Cohesion: 0.60
Nodes (4): HomeSections(), HomeSectionsProps, sectionCardClass(), SectionContent()

### Community 32 - "authContext.tsx"
Cohesion: 0.15
Nodes (13): HostWidgetEmbed(), HostWidgetEmbedProps, AuthContext, AuthContextValue, AuthProvider(), AuthUser, bootstrapAuth(), clearToken() (+5 more)

### Community 33 - "agent.ts"
Cohesion: 0.31
Nodes (8): AnalyzeDateRangeProps, dateFromYmd(), DayPickerField(), formatYmd(), ymdFromLocalDate(), Popover(), PopoverContent(), PopoverTrigger()

### Community 34 - "cn"
Cohesion: 0.08
Nodes (43): allowBlobImageSrc(), NewsRichEditor(), NewsRichEditorProps, QuillEditorApi, QuillProps, ReactQuillHandle, TOOLBAR, Draft (+35 more)

### Community 35 - "VariableReferencePicker.tsx"
Cohesion: 0.25
Nodes (12): mediaSrc(), STATUS_STYLES, UiButtonGroup(), UiCard(), UiKeyValue(), UiMedia(), UiStack(), UiStatusBadge() (+4 more)

### Community 36 - "ToggleRow.tsx"
Cohesion: 0.27
Nodes (10): c(), d(), f(), h(), l(), m(), n(), r() (+2 more)

### Community 37 - "planContext.tsx"
Cohesion: 0.14
Nodes (14): FIELD_HELP, HelpKey, PlansAdminForm(), ToggleRow(), emptyPlanForm(), formValuesToPayload(), Plan, PlanFormValues (+6 more)

### Community 38 - "quillTopicRef.ts"
Cohesion: 0.09
Nodes (10): Route, Route, Route, projectRouteApi, Route, Route, Route, Route (+2 more)

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
Cohesion: 0.22
Nodes (5): FinalCta(), HeroSection(), TRUST_ROW_1, TRUST_ROW_2, Route

### Community 43 - "route.tsx"
Cohesion: 0.43
Nodes (6): normalizeRender(), templateRoot(), ToolUiConfig(), ToolUiRenderMode, flattenJsonSchemaPaths(), collectBindNames()

### Community 44 - "chat.tsx"
Cohesion: 0.16
Nodes (14): useAuth(), fetchUserPlan(), PlanContext, PlanContextValue, PlanProvider(), usePlan(), UserPlan, AdminIndexPage() (+6 more)

### Community 45 - "HomeCanvasBuilder.tsx"
Cohesion: 0.12
Nodes (22): BUILDER_TABS, BuilderTab, BuilderTabMeta, WIDGET_TAB_META, WidgetTabMeta, draftFromWidget(), DraftSettings, isSectionTab() (+14 more)

### Community 46 - "WidgetArticleReader.tsx"
Cohesion: 0.06
Nodes (64): stripUiMarkers(), ANSWERABILITY_FILTERS, AnswerabilityChip(), AnswerabilityFilter, BatchTestSection(), BatchTestSectionProps, ChipDot(), groupSummaryLine() (+56 more)

### Community 47 - "JsonTemplateBuilder.tsx"
Cohesion: 0.31
Nodes (9): agentMarkdownToHtml(), agentProseClassName(), sanitizeHtml(), AgentChatImageRenderer, AgentMessageBody(), AuthAgentChatImage(), AuthImage(), fetchArticleMediaObjectUrl() (+1 more)

### Community 48 - "SideDrawer.tsx"
Cohesion: 0.28
Nodes (8): BODY_SIZE, lockBodyScroll(), PANEL_SIZE, PANEL_SIZE_WITH_DETAILS, SideDrawer(), SideDrawerProps, SideDrawerSize, unlockBodyScroll()

### Community 49 - "HomeChromeUploads.tsx"
Cohesion: 0.17
Nodes (14): WidgetChatList(), WidgetChatListProps, LiveChatMessage, newId(), WidgetLiveAgentChat(), WidgetLiveAgentChatProps, emitTicketTyping(), listPublicLiveAgentTicketMessages() (+6 more)

### Community 50 - "router.tsx"
Cohesion: 0.17
Nodes (12): MeetingListViewProps, MeetingToolSection(), MeetingToolSectionProps, mergeMeetings(), UPCOMING_VIEWS, UpcomingView, calendarMonthRange(), isUpcoming() (+4 more)

### Community 51 - "reset-password.tsx"
Cohesion: 0.18
Nodes (20): addDaysYmd(), dateToYmd(), dowForYmd(), isWeeklyOpenDay(), monthBounds(), pad2(), parseYmd(), slotChipLabel() (+12 more)

### Community 52 - "article.tsx"
Cohesion: 0.15
Nodes (9): getRouter(), Register, @tanstack/react-router, Register, routeTree, allowlistCache, CachedAllowlist, embedFramePolicy (+1 more)

### Community 53 - "guidance.tsx"
Cohesion: 0.17
Nodes (12): Application claims, Claims Are Context, Not Authorization, Clock Skew, Good Patterns, Keep claims small, Login example, Registered claims, Reminting Tokens (+4 more)

### Community 55 - "jobs.tsx"
Cohesion: 0.29
Nodes (7): Button(), buttonVariants, Calendar(), CalendarDayButton(), ToolUiKind, WidgetToolLoadingCard(), WidgetToolLoadingCardProps

### Community 57 - "route.tsx"
Cohesion: 0.28
Nodes (7): defaultCode, DocsMarkdown(), DocsMarkdownProps, docsMarkdownToHtml(), docsProseClassName, docsRenderer, rewriteDocLinks()

### Community 58 - "login.tsx"
Cohesion: 0.23
Nodes (11): AnalyticsExplorer(), AnalyticsExplorerProps, formatShortDate(), layoutTreemap(), SparklineRow(), TILE_COLORS, toVolumeTiles(), TreemapRect (+3 more)

### Community 59 - "register.tsx"
Cohesion: 0.18
Nodes (16): createAuthImageRenderer(), formatTimeToFirst(), InfluenceDetails(), InfluenceSection(), SessionState, TrainTestAgentPanel(), TrainTestAgentPanelProps, influenceVisibleSourceCount() (+8 more)

### Community 60 - "index.tsx"
Cohesion: 0.17
Nodes (8): UsersAdminForm(), AdminUser, AdminUserDetail, AdminUserProject, ApiResponseDto, useDebouncedValue(), AdminUserDetailPage(), Route

### Community 61 - "mcp.tsx"
Cohesion: 0.18
Nodes (11): Allowed domains, Checklist, Contents, Embedding the Widget, How it works, Install, Next step, Optional controls (+3 more)

### Community 63 - "route.tsx"
Cohesion: 0.50
Nodes (3): ArticleSearch, Route, TrainArticlesPage()

### Community 64 - "$publicKey.tsx"
Cohesion: 0.16
Nodes (10): AddBlockControl(), CHILD_NODE_TYPES, ChildNodeType, ChildrenEditor(), createNode(), NODE_META, NodeEditor(), nodeSummary() (+2 more)

### Community 70 - "WidgetChatAgent.tsx"
Cohesion: 0.16
Nodes (13): AgentChatThread(), AgentChatThreadProps, AgentChatErrorHandling, AgentChatMessage, AgentChatStreamFn, AgentChatStreamResultExtras, UseAgentChatThreadOptions, AgentInfluence (+5 more)

### Community 72 - "FaqArticlePicker.tsx"
Cohesion: 0.08
Nodes (28): ToggleRow(), ToggleRowProps, WidgetChatForm(), WidgetChatFormProps, WidgetFaqForm(), WidgetFaqFormProps, WidgetFormSection(), WidgetFormSectionProps (+20 more)

### Community 73 - "$slug.tsx"
Cohesion: 0.24
Nodes (6): DOC_PAGES, DocPage, DOCS_INDEX_MARKDOWN, getDocBySlug(), Route, Route

### Community 74 - "visitor-jwt.md"
Cohesion: 0.22
Nodes (7): Contents, Embed the SapAi Widget, How Visitor JWT Works, Integration Overview, Troubleshooting, Visitor Context in the Agent and MCP, Visitor JWT   Identity & Page Context

### Community 75 - "ApiKeysSection.tsx"
Cohesion: 0.20
Nodes (10): McpDrawer(), McpDrawerProps, parseSchemaProperties(), SchemaProperty, schemaTypeLabel(), StatusPill(), SyncStatusPill(), ToolSchemaDetails() (+2 more)

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

### Community 86 - "quillPasteImages.ts"
Cohesion: 0.11
Nodes (24): allowBlobImageSrc(), QuillEditorApi, QuillProps, ReactQuillHandle, ReadOnlyBlocks(), SelectedImage, TOOLBAR, TOPIC_BODY_HTML_CLASS (+16 more)

### Community 87 - "README.md"
Cohesion: 0.50
Nodes (3): Demo files, Getting Started, Learn More

### Community 91 - "MetricCard.tsx"
Cohesion: 0.40
Nodes (4): MetricCard(), MetricCardProps, MetricTone, TONE_CLASS

### Community 95 - "register.tsx"
Cohesion: 0.14
Nodes (13): LoginForm(), LoginFormProps, LoginResponse, RegisterForm(), RegisterFormProps, RegisterResponse, CollaborationInvite, createCollaborationInvite() (+5 more)

## Knowledge Gaps
- **502 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+497 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report**   run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `ApiKeysSection.tsx` to `article.ts`, `McpSection.tsx`, `WidgetRuntimeContext.tsx`, `GuidanceContentEditor.tsx`, `utils.ts`, `widget.ts`, `ProjectSidebar.tsx`, `PlansAdminForm.tsx`, `ProjectSectionPlaceholder.tsx`, `utils.ts`, `brandingContext.tsx`, `GuidanceSection.tsx`, `FileRoutesByPath`, `WidgetBuilder.tsx`, `UsersAdminForm.tsx`, `SandboxChatForm.tsx`, `SandboxOcrForm.tsx`, `TranslateLanguageCombobox.tsx`, `TopicRichEditor.tsx`, `ui-classes.ts`, `agent.ts`, `cn`, `VariableReferencePicker.tsx`, `planContext.tsx`, `command.tsx`, `ArticleDrawer.tsx`, `route.tsx`, `chat.tsx`, `HomeCanvasBuilder.tsx`, `WidgetArticleReader.tsx`, `JsonTemplateBuilder.tsx`, `SideDrawer.tsx`, `HomeChromeUploads.tsx`, `router.tsx`, `reset-password.tsx`, `jobs.tsx`, `route.tsx`, `login.tsx`, `register.tsx`, `index.tsx`, `route.tsx`, `$publicKey.tsx`, `WidgetChatAgent.tsx`, `FaqArticlePicker.tsx`, `ApiKeysSection.tsx`, `SnippetDrawer.tsx`, `quillPasteImages.ts`, `MetricCard.tsx`?**
  _High betweenness centrality (0.373) - this node is a cross-community bridge._
- **Why does `react` connect `dependencies` to `jobs.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `CalendarDayButton()` connect `jobs.tsx` to `dependencies`, `ApiKeysSection.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _502 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routeTree.gen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03076923076923077 - nodes in this community are weakly interconnected._
- **Should `article.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05225576111652061 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._