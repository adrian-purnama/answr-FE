# Graph Report - frontend  (2026-09-11)

## Corpus Check
- 180 files · ~100,333 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1319 nodes · 3145 edges · 71 communities (51 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.51)
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
- live-agent.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 233 edges
2. `apiFetch()` - 67 edges
3. `FileRoutesByPath` - 40 edges
4. `parseContentToBlocks()` - 25 edges
5. `serializeContentBlocks()` - 24 edges
6. `useWidgetRuntime()` - 17 edges
7. `usePlan()` - 17 edges
8. `compilerOptions` - 17 edges
9. `useAuth()` - 15 edges
10. `formatTopicRef()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `CalendarDayButton()` --references--> `react`  [EXTRACTED]
  src/components/ui/calendar.tsx → package.json
- `AgentChatThread()` --calls--> `cn()`  [EXTRACTED]
  src/components/agentChat/AgentChatThread.tsx → src/lib/utils.ts
- `ApiKeysSkeleton()` --calls--> `cn()`  [EXTRACTED]
  src/components/apiKeys/ApiKeysSection.tsx → src/lib/utils.ts
- `StatusPill()` --calls--> `cn()`  [EXTRACTED]
  src/components/articles/ArticleDrawer.tsx → src/lib/utils.ts
- `SyncPill()` --calls--> `cn()`  [EXTRACTED]
  src/components/articles/ArticleDrawer.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (71 total, 20 thin omitted)

### Community 0 - "routeTree.gen.ts"
Cohesion: 0.03
Nodes (58): AdminAppConfigRoute, AdminIndexRoute, AdminJobsRoute, AdminPlansRoute, AdminRouteRoute, AdminRouteRouteChildren, AdminRouteRouteWithChildren, AdminUsersRoute (+50 more)

### Community 1 - "article.ts"
Cohesion: 0.12
Nodes (35): ArticlesSection(), ArticlesSectionProps, rollupSyncStatus(), TopicReferencePicker(), TopicReferencePickerProps, FaqArticlePickerProps, apiFetch(), Article (+27 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (43): eslint, devDependencies, eslint, prettier, @tailwindcss/typography, @tanstack/devtools-vite, @tanstack/eslint-config, @tanstack/router-cli (+35 more)

### Community 3 - "dependencies"
Cohesion: 0.04
Nodes (45): class-variance-authority, clsx, cmdk, date-fns, lucide-react, marked, dependencies, class-variance-authority (+37 more)

### Community 4 - "McpSection.tsx"
Cohesion: 0.07
Nodes (49): PickerTool, ToolReferencePicker(), ToolReferencePickerProps, schemaFieldPaths(), VariableOption, VariableReferencePicker(), VariableReferencePickerProps, McpDrawer() (+41 more)

### Community 5 - "WidgetRuntimeContext.tsx"
Cohesion: 0.10
Nodes (24): BUILDER_TABS, BuilderTab, BuilderTabMeta, WIDGET_TAB_META, WidgetTabMeta, ArticleViewState, ChatView, useWidgetRuntime() (+16 more)

### Community 6 - "GuidanceContentEditor.tsx"
Cohesion: 0.08
Nodes (43): formatMeetingWhen(), MeetingToolSection(), MeetingToolSectionProps, COMMON_TIMEZONES, MeetingTopicDrawer(), MeetingTopicDrawerProps, addDaysYmd(), dateToYmd() (+35 more)

### Community 7 - "job.ts"
Cohesion: 0.12
Nodes (25): buildCodeExamples(), CodeLang, escapeForSingleQuotes(), SandboxTranslateFormProps, createChatJob(), CreateChatJobOut, createOcrJob(), CreateOcrJobOut (+17 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, eslint.config.js, prettier.config.js, **/*.ts, **/*.tsx, vite/client (+19 more)

### Community 9 - "utils.ts"
Cohesion: 0.14
Nodes (16): JsonFieldRowProps, Select(), SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator() (+8 more)

### Community 10 - "widget.ts"
Cohesion: 0.07
Nodes (37): ChatPage(), WidgetChatList(), WidgetChatListProps, LiveChatMessage, newId(), WidgetLiveAgentChat(), WidgetLiveAgentChatProps, connectVisitorLiveAgentSocket() (+29 more)

### Community 11 - "articleContent.ts"
Cohesion: 0.12
Nodes (20): escapeAttr(), sanitizeArticleHtml(), topicBodyHtml(), WidgetArticleReader(), WidgetArticleReaderProps, TopicEditorBlock, TopicImageBlock, TopicTextBlock (+12 more)

### Community 12 - "contentReferences.ts"
Cohesion: 0.12
Nodes (26): reconcileSavePayloadWithEditorDelta(), applyVarBindings(), ContentBlock, defaultToolAlias(), formatVarRef(), hasTopicRef(), ImageBlock, insertTopicRefAt() (+18 more)

### Community 13 - "TrainTestAgentPanel.tsx"
Cohesion: 0.07
Nodes (47): agentMarkdownToHtml(), agentProseClassName(), newAgentChatMessageId(), sanitizeHtml(), stripUiMarkers(), AgentChatThread(), AgentChatThreadProps, AgentChatImageRenderer (+39 more)

### Community 14 - "ProjectSidebar.tsx"
Cohesion: 0.05
Nodes (52): ApiKeysSection(), ApiKeysSkeleton(), FIELD_HELP, HelpKey, PlansAdminForm(), ToggleRow(), ProjectSettings(), ProjectSettingsProps (+44 more)

### Community 15 - "PlansAdminForm.tsx"
Cohesion: 0.08
Nodes (44): LiveAgentDashboard(), LiveAgentDashboardProps, waitingLabel(), LiveAgentDrawer(), LiveAgentDrawerProps, StatusPill(), IconAction(), LiveAgentSectionProps (+36 more)

### Community 16 - "ProjectSectionPlaceholder.tsx"
Cohesion: 0.13
Nodes (6): ProjectSectionPlaceholder(), ProjectSectionPlaceholderProps, Route, Route, Route, Route

### Community 17 - "utils.ts"
Cohesion: 0.17
Nodes (18): JsonFieldRow(), DraggableInsert(), VariableSidebar(), VariableSidebarProps, buildExampleJson(), buildExampleValue(), collectPathsFromNode(), collectVariablePaths() (+10 more)

### Community 18 - "HomeCanvasRenderer.tsx"
Cohesion: 0.21
Nodes (12): HomeSections(), HomeSectionsProps, PlaceholderCard(), sectionCardClass(), SectionContent(), sectionCardClass(), WidgetFaqList(), WidgetFaqListProps (+4 more)

### Community 19 - "brandingContext.tsx"
Cohesion: 0.16
Nodes (13): Footer(), FOOTER_COLUMNS, Header(), NAV_LINKS, bootstrapBranding(), Branding, BrandingContext, BrandingContextValue (+5 more)

### Community 20 - "GuidanceSection.tsx"
Cohesion: 0.09
Nodes (23): ArticlesSkeleton(), IconAction(), StatusPill(), SyncPill(), TopicSyncPill(), IconAction(), SnippetsSkeleton(), StatusPill() (+15 more)

### Community 21 - "FileRoutesByPath"
Cohesion: 0.09
Nodes (11): projectRouteApi, Route, Route, Route, Route, Route, Route, Route (+3 more)

### Community 22 - "ApiKeysSection.tsx"
Cohesion: 0.13
Nodes (13): ACCESS_MODE_LABELS, BadgeImageField(), CopyField(), WidgetConfigurationForm(), WidgetConfigurationFormProps, isEmbedHostAllowed(), normalizeEmbedDomain(), VISITOR_JWT_ALGORITHM_VALUES (+5 more)

### Community 23 - "WidgetBuilder.tsx"
Cohesion: 0.13
Nodes (28): WidgetRuntimeProvider(), usePublicWidgetLoad(), WidgetApp(), WidgetAppProps, draftFromWidget(), DraftSettings, isSectionTab(), previewForceTab() (+20 more)

### Community 24 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "UsersAdminForm.tsx"
Cohesion: 0.21
Nodes (14): createAuthImageRenderer(), InfluenceDetails(), InfluenceSection(), SessionState, TrainTestAgentPanel(), TrainTestAgentPanelProps, influenceVisibleSourceCount(), mergeInfluences() (+6 more)

### Community 26 - "SandboxChatForm.tsx"
Cohesion: 0.20
Nodes (14): buildChatRequestBody(), buildCodeExamples(), CodeLang, createMessageRow(), escapeForSingleQuotes(), MessageRow, SandboxChatForm(), SandboxChatFormProps (+6 more)

### Community 27 - "SandboxOcrForm.tsx"
Cohesion: 0.18
Nodes (19): buildCodeExamples(), CodeLang, escapeForSingleQuotes(), ImageInputMode, OCR_PROMPT_OPTIONS, SandboxOcrForm(), SandboxOcrFormProps, SandboxTranslateForm() (+11 more)

### Community 28 - "TranslateLanguageCombobox.tsx"
Cohesion: 0.12
Nodes (22): formatLanguageLabel(), TranslateLanguageCombobox(), TranslateLanguageComboboxProps, Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput() (+14 more)

### Community 29 - "Building For Production"
Cohesion: 0.12
Nodes (15): Adding A Route, Adding Links, API Routes, Building For Production, Data Fetching, Demo files, Getting Started, Learn More (+7 more)

### Community 30 - "TopicRichEditor.tsx"
Cohesion: 0.13
Nodes (18): allowBlobImageSrc(), AuthImage(), QuillEditorApi, QuillProps, ReactQuillHandle, SelectedImage, TOOLBAR, TopicRichEditor() (+10 more)

### Community 31 - "ui-classes.ts"
Cohesion: 0.16
Nodes (18): SnippetsSection(), SnippetsSectionProps, AppConfigData, AppConfigForm(), getToken(), apiUpload(), toAbsoluteMediaUrl(), pushText() (+10 more)

### Community 32 - "authContext.tsx"
Cohesion: 0.24
Nodes (10): AuthContext, AuthContextValue, AuthProvider(), AuthUser, bootstrapAuth(), clearToken(), fetchValidatedUser(), invalidateAuthCache() (+2 more)

### Community 33 - "agent.ts"
Cohesion: 0.39
Nodes (6): JsonTemplateBuilder(), JsonTemplateBuilderProps, Button(), buttonVariants, Calendar(), CalendarDayButton()

### Community 34 - "cn"
Cohesion: 0.47
Nodes (4): readOnlyInputClassName, ResetPasswordForm(), decodeResetToken(), ResetTokenPayload

### Community 35 - "VariableReferencePicker.tsx"
Cohesion: 0.25
Nodes (6): fetchOwnedPreviewUrl(), HomeChromeUploadsProps, MediaSlot(), uploadWidgetMedia(), WidgetHomeSettings, WidgetMediaType

### Community 36 - "ToggleRow.tsx"
Cohesion: 0.18
Nodes (12): ToggleRow(), ToggleRowProps, WidgetChatForm(), WidgetChatFormProps, WidgetFaqForm(), WidgetFaqFormProps, WidgetFormSection(), WidgetFormSectionProps (+4 more)

### Community 37 - "planContext.tsx"
Cohesion: 0.24
Nodes (9): LiveAgentSection(), fetchUserPlan(), PlanContext, PlanContextValue, PlanProvider(), usePlan(), UserPlan, ProfilePage() (+1 more)

### Community 38 - "quillTopicRef.ts"
Cohesion: 0.50
Nodes (3): ArticleSearch, Route, TrainArticlesPage()

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
Cohesion: 0.08
Nodes (50): ReadOnlyBlocks(), GuidanceContentEditorProps, QuillEditorApi, QuillProps, ReactQuillHandle, ReadOnlyContent(), ToolChip(), TopicChip() (+42 more)

### Community 44 - "chat.tsx"
Cohesion: 0.19
Nodes (7): CAPABILITY_LABELS, formatCapabilityList(), SandboxCapabilityGate(), SandboxCapabilityGateProps, Route, Route, Route

### Community 45 - "HomeCanvasBuilder.tsx"
Cohesion: 0.18
Nodes (12): ElementInspector(), ElementInspectorProps, ElementPalette(), ElementPaletteProps, ITEMS, createSection(), HomeCanvasBuilder(), HomeCanvasBuilderProps (+4 more)

### Community 48 - "SideDrawer.tsx"
Cohesion: 0.10
Nodes (15): ArticleDrawerProps, StatusPill(), SyncPill(), SnippetDrawerProps, StatusPill(), SyncPill(), DrawerDetails(), DrawerDetailsProps (+7 more)

### Community 49 - "HomeChromeUploads.tsx"
Cohesion: 0.31
Nodes (8): embedSrc(), HostWidgetEmbed(), HostWidgetEmbedProps, createVisitorJwt(), VISITOR_TOKEN_REQUEST_MESSAGE_TYPE, WIDGET_FRAME_MESSAGE_TYPE, WidgetFrameMessage, widgetFrameSize()

### Community 50 - "router.tsx"
Cohesion: 0.33
Nodes (5): getRouter(), Register, @tanstack/react-router, Register, routeTree

### Community 56 - "plans.tsx"
Cohesion: 0.20
Nodes (10): LoginForm(), LoginResponse, PasswordInput(), PasswordInputProps, RegisterForm(), RegisterResponse, useAuth(), setAgentToken() (+2 more)

### Community 60 - "index.tsx"
Cohesion: 0.53
Nodes (3): UsersAdminForm(), AdminUser, useDebouncedValue()

## Knowledge Gaps
- **363 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+358 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report**   run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `GuidanceSection.tsx` to `article.ts`, `McpSection.tsx`, `WidgetRuntimeContext.tsx`, `GuidanceContentEditor.tsx`, `job.ts`, `utils.ts`, `widget.ts`, `articleContent.ts`, `TrainTestAgentPanel.tsx`, `ProjectSidebar.tsx`, `PlansAdminForm.tsx`, `ProjectSectionPlaceholder.tsx`, `utils.ts`, `HomeCanvasRenderer.tsx`, `brandingContext.tsx`, `ApiKeysSection.tsx`, `WidgetBuilder.tsx`, `UsersAdminForm.tsx`, `SandboxChatForm.tsx`, `SandboxOcrForm.tsx`, `TranslateLanguageCombobox.tsx`, `TopicRichEditor.tsx`, `ui-classes.ts`, `agent.ts`, `cn`, `VariableReferencePicker.tsx`, `ToggleRow.tsx`, `planContext.tsx`, `quillTopicRef.ts`, `ArticleDrawer.tsx`, `route.tsx`, `HomeCanvasBuilder.tsx`, `SideDrawer.tsx`, `HomeChromeUploads.tsx`, `plans.tsx`, `index.tsx`?**
  _High betweenness centrality (0.399) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `CalendarDayButton()` connect `agent.ts` to `dependencies`, `GuidanceSection.tsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _363 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routeTree.gen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03389830508474576 - nodes in this community are weakly interconnected._
- **Should `article.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._