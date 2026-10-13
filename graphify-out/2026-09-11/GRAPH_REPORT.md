# Graph Report - frontend  (2026-09-11)

## Corpus Check
- 175 files · ~100,001 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1304 nodes · 3091 edges · 73 communities (51 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.51)
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
- login.tsx
- route.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 226 edges
2. `apiFetch()` - 67 edges
3. `FileRoutesByPath` - 40 edges
4. `parseContentToBlocks()` - 27 edges
5. `serializeContentBlocks()` - 24 edges
6. `useWidgetRuntime()` - 17 edges
7. `usePlan()` - 17 edges
8. `compilerOptions` - 17 edges
9. `useAuth()` - 15 edges
10. `formatTopicRef()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `ApiKeysSkeleton()` --calls--> `cn()`  [EXTRACTED]
  src/components/apiKeys/ApiKeysSection.tsx → src/lib/utils.ts
- `StatusPill()` --calls--> `cn()`  [EXTRACTED]
  src/components/articles/ArticleDrawer.tsx → src/lib/utils.ts
- `SyncPill()` --calls--> `cn()`  [EXTRACTED]
  src/components/articles/ArticleDrawer.tsx → src/lib/utils.ts
- `ArticlesSkeleton()` --calls--> `cn()`  [EXTRACTED]
  src/components/articles/ArticlesSection.tsx → src/lib/utils.ts
- `StatusPill()` --calls--> `cn()`  [EXTRACTED]
  src/components/articles/ArticlesSection.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (73 total, 22 thin omitted)

### Community 0 - "routeTree.gen.ts"
Cohesion: 0.03
Nodes (58): AdminAppConfigRoute, AdminIndexRoute, AdminJobsRoute, AdminPlansRoute, AdminRouteRoute, AdminRouteRouteChildren, AdminRouteRouteWithChildren, AdminUsersRoute (+50 more)

### Community 1 - "article.ts"
Cohesion: 0.05
Nodes (65): ArticleDrawerProps, StatusPill(), SyncPill(), ArticlesSection(), ArticlesSectionProps, ArticlesSkeleton(), IconAction(), rollupSyncStatus() (+57 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (43): eslint, devDependencies, eslint, prettier, @tailwindcss/typography, @tanstack/devtools-vite, @tanstack/eslint-config, @tanstack/router-cli (+35 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (41): class-variance-authority, clsx, cmdk, lucide-react, marked, dependencies, class-variance-authority, clsx (+33 more)

### Community 4 - "McpSection.tsx"
Cohesion: 0.07
Nodes (47): PickerTool, ToolReferencePicker(), ToolReferencePickerProps, schemaFieldPaths(), VariableOption, VariableReferencePicker(), VariableReferencePickerProps, McpDrawer() (+39 more)

### Community 5 - "WidgetRuntimeContext.tsx"
Cohesion: 0.20
Nodes (12): useWidgetRuntime(), ChatPage(), FaqPage(), HomePage(), NewsPage(), PlaceholderView(), WidgetChatListProps, WidgetChromeActions() (+4 more)

### Community 6 - "GuidanceContentEditor.tsx"
Cohesion: 0.08
Nodes (40): formatMeetingWhen(), MeetingToolSection(), MeetingToolSectionProps, COMMON_TIMEZONES, MeetingTopicDrawer(), MeetingTopicDrawerProps, addDaysYmd(), monthBounds() (+32 more)

### Community 7 - "job.ts"
Cohesion: 0.15
Nodes (19): createChatJob(), CreateChatJobInput, CreateChatJobOut, createOcrJob(), CreateOcrJobOut, createTranslateJob(), CreateTranslateJobOut, getJob() (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, eslint.config.js, prettier.config.js, **/*.ts, **/*.tsx, vite/client (+19 more)

### Community 9 - "utils.ts"
Cohesion: 0.11
Nodes (22): JsonFieldRow(), JsonFieldRowProps, JsonTemplateBuilder(), JsonTemplateBuilderProps, Button(), buttonVariants, Select(), SelectContent() (+14 more)

### Community 10 - "widget.ts"
Cohesion: 0.08
Nodes (30): usePublicWidgetLoad(), ButtonTextAlign, createOwnedChatSession(), CreateVisitorJwtResult, getActivePublicLiveAgentTicket(), getOwnedChatSession(), getPublicWidget(), getWidget() (+22 more)

### Community 11 - "articleContent.ts"
Cohesion: 0.19
Nodes (14): TopicContentSavePayload, editorBlocksToHtml(), editorHtmlToSavePayload(), escapeAttr(), htmlToTopicContent(), ImageSrcMeta, isEditorEmptyHtml(), looksLikeHtml() (+6 more)

### Community 12 - "contentReferences.ts"
Cohesion: 0.11
Nodes (27): applyVarBindings(), attr(), ContentBlock, formatImageRef(), formatToolVariableRef(), formatTopicRef(), formatVarRef(), hasTopicRef() (+19 more)

### Community 13 - "TrainTestAgentPanel.tsx"
Cohesion: 0.08
Nodes (41): AuthImage(), agentMarkdownToHtml(), AgentMessageBody(), agentProseClassName, ChatBubble(), ChatImage(), formatChatTime(), formatDayLabel() (+33 more)

### Community 14 - "ProjectSidebar.tsx"
Cohesion: 0.05
Nodes (51): ApiKeysSection(), ApiKeysSkeleton(), FIELD_HELP, HelpKey, PlansAdminForm(), ToggleRow(), ProjectSettings(), ProjectSettingsProps (+43 more)

### Community 15 - "PlansAdminForm.tsx"
Cohesion: 0.14
Nodes (27): LiveAgentDrawer(), LiveAgentDrawerProps, StatusPill(), IconAction(), LiveAgentSection(), LiveAgentSectionProps, StatusPill(), apiFetch() (+19 more)

### Community 16 - "ProjectSectionPlaceholder.tsx"
Cohesion: 0.13
Nodes (6): ProjectSectionPlaceholder(), ProjectSectionPlaceholderProps, Route, Route, Route, Route

### Community 17 - "utils.ts"
Cohesion: 0.19
Nodes (16): DraggableInsert(), VariableSidebar(), VariableSidebarProps, buildExampleJson(), buildExampleValue(), collectPathsFromNode(), collectVariablePaths(), collectVariables() (+8 more)

### Community 18 - "HomeCanvasRenderer.tsx"
Cohesion: 0.23
Nodes (11): HomeSections(), HomeSectionsProps, PlaceholderCard(), sectionCardClass(), SectionContent(), sectionCardClass(), WidgetFaqList(), WidgetFaqListProps (+3 more)

### Community 19 - "brandingContext.tsx"
Cohesion: 0.16
Nodes (13): Footer(), FOOTER_COLUMNS, Header(), NAV_LINKS, bootstrapBranding(), Branding, BrandingContext, BrandingContextValue (+5 more)

### Community 20 - "GuidanceSection.tsx"
Cohesion: 0.12
Nodes (24): ArticleViewState, ChatView, WidgetPanelSettings, WidgetRuntimeContext, WidgetRuntimeContextValue, WidgetRuntimeProvider(), WidgetRuntimeProviderProps, ApplySessionFn (+16 more)

### Community 21 - "FileRoutesByPath"
Cohesion: 0.10
Nodes (12): Route, Route, Route, ArticleSearch, Route, TrainArticlesPage(), Route, Route (+4 more)

### Community 22 - "ApiKeysSection.tsx"
Cohesion: 0.13
Nodes (19): agentMarkdownToHtml(), AgentMessageBody(), agentProseClassName(), ChatMessage, greetingText(), newId(), sanitizeHtml(), stripUiMarkers() (+11 more)

### Community 23 - "WidgetBuilder.tsx"
Cohesion: 0.11
Nodes (23): BUILDER_TABS, BuilderTab, BuilderTabMeta, WIDGET_TAB_META, WidgetTabMeta, WidgetTab, WidgetHomeForm(), WidgetHomeFormProps (+15 more)

### Community 24 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "UsersAdminForm.tsx"
Cohesion: 0.10
Nodes (33): LiveAgentDashboard(), LiveAgentDashboardProps, waitingLabel(), WidgetChatList(), LiveChatMessage, newId(), WidgetLiveAgentChat(), WidgetLiveAgentChatProps (+25 more)

### Community 26 - "SandboxChatForm.tsx"
Cohesion: 0.24
Nodes (12): buildChatRequestBody(), buildCodeExamples(), CodeLang, createMessageRow(), escapeForSingleQuotes(), MessageRow, SandboxChatForm(), SandboxChatFormProps (+4 more)

### Community 27 - "SandboxOcrForm.tsx"
Cohesion: 0.21
Nodes (15): buildCodeExamples(), CodeLang, escapeForSingleQuotes(), ImageInputMode, OCR_PROMPT_OPTIONS, SandboxOcrForm(), SandboxOcrFormProps, buildOcrMessages() (+7 more)

### Community 28 - "TranslateLanguageCombobox.tsx"
Cohesion: 0.16
Nodes (23): formatLanguageLabel(), TranslateLanguageCombobox(), TranslateLanguageComboboxProps, Command(), CommandDialog(), CommandEmpty(), CommandGroup(), CommandInput() (+15 more)

### Community 29 - "Building For Production"
Cohesion: 0.12
Nodes (15): Adding A Route, Adding Links, API Routes, Building For Production, Data Fetching, Demo files, Getting Started, Learn More (+7 more)

### Community 30 - "TopicRichEditor.tsx"
Cohesion: 0.12
Nodes (27): allowBlobImageSrc(), QuillEditorApi, QuillProps, ReactQuillHandle, ReadOnlyBlocks(), SelectedImage, TOOLBAR, TopicRichEditor() (+19 more)

### Community 31 - "ui-classes.ts"
Cohesion: 0.33
Nodes (4): AppConfigData, AppConfigForm(), ToggleRow(), Route

### Community 32 - "authContext.tsx"
Cohesion: 0.22
Nodes (10): AuthContext, AuthContextValue, AuthProvider(), AuthUser, bootstrapAuth(), clearToken(), fetchValidatedUser(), getToken() (+2 more)

### Community 33 - "agent.ts"
Cohesion: 0.23
Nodes (12): buildCodeExamples(), CodeLang, escapeForSingleQuotes(), SandboxTranslateForm(), SandboxTranslateFormProps, CreateTranslateJobInput, fetchTranslateLanguages(), JobOut (+4 more)

### Community 35 - "VariableReferencePicker.tsx"
Cohesion: 0.33
Nodes (4): fetchOwnedPreviewUrl(), HomeChromeUploadsProps, MediaSlot(), WidgetMediaType

### Community 36 - "ToggleRow.tsx"
Cohesion: 0.09
Nodes (23): ToggleRow(), ToggleRowProps, WidgetChatForm(), WidgetChatFormProps, ACCESS_MODE_LABELS, BadgeImageField(), CopyField(), WidgetConfigurationForm() (+15 more)

### Community 37 - "planContext.tsx"
Cohesion: 0.27
Nodes (8): fetchUserPlan(), PlanContext, PlanContextValue, PlanProvider(), usePlan(), UserPlan, ProfilePage(), Route

### Community 38 - "quillTopicRef.ts"
Cohesion: 0.24
Nodes (10): TopicChip(), buildTopicChipElement(), DeltaLike, DeltaOp, fillChip(), plainTextToDeltaOps(), QuillStatic, serializeDeltaToPlainText() (+2 more)

### Community 40 - "WidgetApp.tsx"
Cohesion: 0.20
Nodes (17): SessionState, usePublicWidgetSession(), UsePublicWidgetSessionOptions, readQueryVisitorToken(), useVisitorTokenBridge(), UseVisitorTokenBridgeOptions, bindPublicVisitorIdentity(), clearStoredWidgetChatSession() (+9 more)

### Community 41 - "ArticleDrawer.tsx"
Cohesion: 0.20
Nodes (14): GuidanceDrawer(), GuidanceDrawerProps, StatusPill(), GuidanceSection(), GuidanceSectionProps, GuidanceSkeleton(), IconAction(), StatusPill() (+6 more)

### Community 42 - "index.tsx"
Cohesion: 0.22
Nodes (5): FinalCta(), HeroSection(), TRUST_ROW_1, TRUST_ROW_2, Route

### Community 43 - "route.tsx"
Cohesion: 0.12
Nodes (24): ToolChip(), VariableChip(), formatToolRef(), applyRefChipStatus(), DeltaCtor, DeltaLike, DeltaOp, fillToolChip() (+16 more)

### Community 44 - "chat.tsx"
Cohesion: 0.19
Nodes (7): CAPABILITY_LABELS, formatCapabilityList(), SandboxCapabilityGate(), SandboxCapabilityGateProps, Route, Route, Route

### Community 45 - "HomeCanvasBuilder.tsx"
Cohesion: 0.18
Nodes (12): ElementInspector(), ElementInspectorProps, ElementPalette(), ElementPaletteProps, ITEMS, createSection(), HomeCanvasBuilder(), HomeCanvasBuilderProps (+4 more)

### Community 46 - "WidgetArticleReader.tsx"
Cohesion: 0.24
Nodes (11): escapeAttr(), sanitizeArticleHtml(), topicBodyHtml(), WidgetArticleReader(), WidgetArticleReaderProps, WidgetChatImage(), serializeContentBlocks(), getPublicWidgetArticle() (+3 more)

### Community 48 - "SideDrawer.tsx"
Cohesion: 0.12
Nodes (12): SnippetDrawerProps, StatusPill(), SyncPill(), DrawerDetails(), DrawerDetailsProps, formatRelativeTime(), BODY_SIZE, PANEL_SIZE (+4 more)

### Community 49 - "HomeChromeUploads.tsx"
Cohesion: 0.27
Nodes (9): embedSrc(), HostWidgetEmbed(), HostWidgetEmbedProps, createVisitorJwt(), postWidgetFrameSize(), VISITOR_TOKEN_REQUEST_MESSAGE_TYPE, WIDGET_FRAME_MESSAGE_TYPE, WidgetFrameMessage (+1 more)

### Community 50 - "router.tsx"
Cohesion: 0.33
Nodes (5): getRouter(), Register, @tanstack/react-router, Register, routeTree

### Community 56 - "plans.tsx"
Cohesion: 0.16
Nodes (13): LoginForm(), LoginResponse, PasswordInput(), PasswordInputProps, RegisterForm(), RegisterResponse, readOnlyInputClassName, ResetPasswordForm() (+5 more)

### Community 60 - "index.tsx"
Cohesion: 0.21
Nodes (5): JobsAdminForm(), RunJobWorkerResult, UsersAdminForm(), AdminUser, useDebouncedValue()

## Knowledge Gaps
- **360 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+355 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report**   run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `TranslateLanguageCombobox.tsx` to `article.ts`, `McpSection.tsx`, `WidgetRuntimeContext.tsx`, `GuidanceContentEditor.tsx`, `utils.ts`, `TrainTestAgentPanel.tsx`, `ProjectSidebar.tsx`, `PlansAdminForm.tsx`, `ProjectSectionPlaceholder.tsx`, `utils.ts`, `HomeCanvasRenderer.tsx`, `brandingContext.tsx`, `GuidanceSection.tsx`, `FileRoutesByPath`, `ApiKeysSection.tsx`, `WidgetBuilder.tsx`, `UsersAdminForm.tsx`, `SandboxChatForm.tsx`, `SandboxOcrForm.tsx`, `TopicRichEditor.tsx`, `ui-classes.ts`, `agent.ts`, `cn`, `VariableReferencePicker.tsx`, `ToggleRow.tsx`, `planContext.tsx`, `quillTopicRef.ts`, `ArticleDrawer.tsx`, `route.tsx`, `HomeCanvasBuilder.tsx`, `WidgetArticleReader.tsx`, `SideDrawer.tsx`, `HomeChromeUploads.tsx`, `plans.tsx`, `index.tsx`?**
  _High betweenness centrality (0.305) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `PlansAdminForm.tsx` to `authContext.tsx`, `article.ts`, `McpSection.tsx`, `planContext.tsx`, `GuidanceContentEditor.tsx`, `ArticleDrawer.tsx`, `widget.ts`, `TrainTestAgentPanel.tsx`, `ProjectSidebar.tsx`, `HomeChromeUploads.tsx`, `brandingContext.tsx`, `plans.tsx`, `index.tsx`, `ui-classes.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `parseContentToBlocks()` connect `contentReferences.ts` to `article.ts`, `quillTopicRef.ts`, `articleContent.ts`, `route.tsx`, `TrainTestAgentPanel.tsx`, `WidgetArticleReader.tsx`, `ApiKeysSection.tsx`, `TopicRichEditor.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _360 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routeTree.gen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03389830508474576 - nodes in this community are weakly interconnected._
- **Should `article.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05368382080710848 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._