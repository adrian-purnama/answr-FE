# Graph Report - frontend  (2026-09-08)

## Corpus Check
- 151 files · ~75,949 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1075 nodes · 2384 edges · 69 communities (52 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.51)
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 182 edges
2. `apiFetch()` - 45 edges
3. `FileRoutesByPath` - 37 edges
4. `parseContentToBlocks()` - 24 edges
5. `serializeContentBlocks()` - 23 edges
6. `compilerOptions` - 17 edges
7. `useWidgetRuntime()` - 13 edges
8. `useAuth()` - 13 edges
9. `SandboxChatForm()` - 12 edges
10. `getToken()` - 12 edges

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

## Communities (69 total, 17 thin omitted)

### Community 0 - "routeTree.gen.ts"
Cohesion: 0.04
Nodes (53): AdminAppConfigRoute, AdminIndexRoute, AdminJobsRoute, AdminPlansRoute, AdminRouteRoute, AdminRouteRouteChildren, AdminRouteRouteWithChildren, AdminUsersRoute (+45 more)

### Community 1 - "article.ts"
Cohesion: 0.09
Nodes (43): ArticlesSection(), ArticlesSectionProps, ArticlesSkeleton(), IconAction(), rollupSyncStatus(), StatusPill(), SyncPill(), TopicSyncPill() (+35 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (43): eslint, devDependencies, eslint, prettier, @tailwindcss/typography, @tanstack/devtools-vite, @tanstack/eslint-config, @tanstack/router-cli (+35 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (39): class-variance-authority, clsx, cmdk, lucide-react, marked, dependencies, class-variance-authority, clsx (+31 more)

### Community 4 - "McpSection.tsx"
Cohesion: 0.09
Nodes (32): McpDrawer(), McpDrawerProps, parseSchemaProperties(), SchemaProperty, schemaTypeLabel(), StatusPill(), SyncStatusPill(), ToolSchemaDetails() (+24 more)

### Community 5 - "WidgetRuntimeContext.tsx"
Cohesion: 0.11
Nodes (24): ArticleViewState, ChatView, useWidgetRuntime(), WidgetPanelSettings, WidgetRuntimeContext, WidgetRuntimeContextValue, WidgetRuntimeProviderProps, WidgetTab (+16 more)

### Community 6 - "GuidanceContentEditor.tsx"
Cohesion: 0.11
Nodes (30): GuidanceContentEditor(), GuidanceContentEditorProps, QuillEditorApi, QuillProps, ReactQuillHandle, ReadOnlyContent(), ToolChip(), VariableChip() (+22 more)

### Community 7 - "job.ts"
Cohesion: 0.11
Nodes (27): buildCodeExamples(), CodeLang, escapeForSingleQuotes(), SandboxTranslateFormProps, createChatJob(), CreateChatJobInput, CreateChatJobOut, createOcrJob() (+19 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): DOM, DOM.Iterable, ES2022, eslint.config.js, prettier.config.js, **/*.ts, **/*.tsx, vite/client (+19 more)

### Community 9 - "utils.ts"
Cohesion: 0.16
Nodes (18): JsonFieldRow(), JsonFieldRowProps, Select(), SelectContent(), SelectItem(), SelectTrigger(), SelectValue(), AUTHENTICATION_LABELS (+10 more)

### Community 10 - "widget.ts"
Cohesion: 0.10
Nodes (25): ButtonTextAlign, deleteOwnedChatSession(), getOwnedChatSession(), getWidget(), HomeButtonElement, HomeElementLayout, HomeGoToChatElement, HomeHeadingElement (+17 more)

### Community 11 - "articleContent.ts"
Cohesion: 0.14
Nodes (21): ReadOnlyBlocks(), pushText(), TopicContentSavePayload, topicContentToEditorBlocks(), TopicEditorBlock, TopicImageBlock, TopicTextBlock, editorBlocksToHtml() (+13 more)

### Community 12 - "contentReferences.ts"
Cohesion: 0.13
Nodes (22): applyVarBindings(), ContentBlock, formatVarRef(), hasTopicRef(), ImageBlock, listToolVariables(), listTopicIdsFromContent(), mergeAdjacentText() (+14 more)

### Community 13 - "TrainTestAgentPanel.tsx"
Cohesion: 0.13
Nodes (20): AuthImage(), agentMarkdownToHtml(), AgentMessageBody(), agentProseClassName, ChatBubble(), ChatImage(), formatChatTime(), formatDayLabel() (+12 more)

### Community 14 - "ProjectSidebar.tsx"
Cohesion: 0.15
Nodes (19): isGroupActive(), isNavLinkActive(), navGroupButtonClass, NavGroupItem(), navLinkClass, NavLinkItem(), ProjectMobileDrawer(), ProjectSidebar() (+11 more)

### Community 15 - "PlansAdminForm.tsx"
Cohesion: 0.14
Nodes (15): FIELD_HELP, HelpKey, PlansAdminForm(), ToggleRow(), PUBLIC_CAPABILITIES, emptyPlanForm(), formValuesToPayload(), Plan (+7 more)

### Community 16 - "ProjectSectionPlaceholder.tsx"
Cohesion: 0.10
Nodes (8): ProjectSectionPlaceholder(), ProjectSectionPlaceholderProps, Route, Route, Route, Route, Route, Route

### Community 17 - "utils.ts"
Cohesion: 0.15
Nodes (19): DraggableInsert(), VariableSidebar(), VariableSidebarProps, addChildNode(), buildExampleJson(), buildExampleValue(), buildTypeValue(), collectPathsFromNode() (+11 more)

### Community 18 - "HomeCanvasRenderer.tsx"
Cohesion: 0.13
Nodes (18): clamp(), DragMode, DragState, HomeCanvas(), HomeCanvasProps, ElementContent(), HomeCanvasRenderer(), HomeCanvasRendererProps (+10 more)

### Community 19 - "brandingContext.tsx"
Cohesion: 0.16
Nodes (13): Footer(), FOOTER_COLUMNS, Header(), NAV_LINKS, bootstrapBranding(), Branding, BrandingContext, BrandingContextValue (+5 more)

### Community 20 - "GuidanceSection.tsx"
Cohesion: 0.17
Nodes (16): GuidanceDrawer(), GuidanceDrawerProps, StatusPill(), GuidanceSection(), GuidanceSectionProps, GuidanceSkeleton(), IconAction(), StatusPill() (+8 more)

### Community 21 - "FileRoutesByPath"
Cohesion: 0.10
Nodes (10): Route, Route, Route, Route, projectRouteApi, Route, Route, Route (+2 more)

### Community 22 - "ApiKeysSection.tsx"
Cohesion: 0.17
Nodes (14): ApiKeysSection(), ApiKeysSkeleton(), ProjectSettings(), ProjectSettingsProps, Modal(), ModalProps, ApiKey, ApiKeyStatus (+6 more)

### Community 23 - "WidgetBuilder.tsx"
Cohesion: 0.17
Nodes (18): WidgetRuntimeProvider(), BUILDER_TABS, BuilderTab, draftFromWidget(), DraftSettings, isSectionTab(), normalizeHomeSettings(), sameDomainList() (+10 more)

### Community 24 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "UsersAdminForm.tsx"
Cohesion: 0.16
Nodes (11): LoginForm(), LoginResponse, PasswordInput(), PasswordInputProps, readOnlyInputClassName, ResetPasswordForm(), UsersAdminForm(), AdminUser (+3 more)

### Community 26 - "SandboxChatForm.tsx"
Cohesion: 0.23
Nodes (15): buildChatRequestBody(), buildCodeExamples(), CodeLang, createMessageRow(), escapeForSingleQuotes(), MessageRow, SandboxChatForm(), SandboxChatFormProps (+7 more)

### Community 27 - "SandboxOcrForm.tsx"
Cohesion: 0.21
Nodes (15): buildCodeExamples(), CodeLang, escapeForSingleQuotes(), ImageInputMode, OCR_PROMPT_OPTIONS, SandboxOcrForm(), SandboxOcrFormProps, buildOcrMessages() (+7 more)

### Community 28 - "TranslateLanguageCombobox.tsx"
Cohesion: 0.21
Nodes (14): formatLanguageLabel(), TranslateLanguageCombobox(), TranslateLanguageComboboxProps, Command(), CommandEmpty(), CommandGroup(), CommandInput(), CommandItem() (+6 more)

### Community 29 - "Building For Production"
Cohesion: 0.12
Nodes (15): Adding A Route, Adding Links, API Routes, Building For Production, Data Fetching, Demo files, Getting Started, Learn More (+7 more)

### Community 30 - "TopicRichEditor.tsx"
Cohesion: 0.16
Nodes (10): allowBlobImageSrc(), QuillEditorApi, QuillProps, ReactQuillHandle, SelectedImage, TOOLBAR, TopicRichEditor(), TopicRichEditorProps (+2 more)

### Community 31 - "ui-classes.ts"
Cohesion: 0.19
Nodes (8): AppConfigData, AppConfigForm(), ToggleRow(), ApiResponseDto, apiUpload(), toAbsoluteMediaUrl(), uploadWidgetMedia(), Route

### Community 32 - "authContext.tsx"
Cohesion: 0.20
Nodes (12): WidgetChatForm(), WidgetChatFormProps, AuthContext, AuthContextValue, AuthProvider(), AuthUser, bootstrapAuth(), clearToken() (+4 more)

### Community 33 - "agent.ts"
Cohesion: 0.18
Nodes (13): AgentInfluence, AgentInfluenceArticle, AgentInfluenceChunk, AgentInfluenceDeclaredTool, AgentInfluenceGuidance, AgentInfluenceTool, AgentInfluenceTopic, AgentSseEvent (+5 more)

### Community 34 - "cn"
Cohesion: 0.16
Nodes (12): JobsAdminForm(), RunJobWorkerResult, FeatureShowcase(), RECENT_ACTIVITY, JsonTemplateBuilder(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton() (+4 more)

### Community 35 - "VariableReferencePicker.tsx"
Cohesion: 0.21
Nodes (12): ToolInsertPayload, ToolReferencePicker(), ToolReferencePickerProps, schemaFieldPaths(), VariableInsertPayload, VariableOption, VariableReferencePicker(), VariableReferencePickerProps (+4 more)

### Community 36 - "ToggleRow.tsx"
Cohesion: 0.19
Nodes (8): ToggleRow(), ToggleRowProps, WidgetFaqFormProps, WidgetHomeForm(), WidgetHomeFormProps, WidgetNewsFormProps, WidgetHomeSettings, WidgetSectionSettings

### Community 37 - "planContext.tsx"
Cohesion: 0.21
Nodes (10): RegisterForm(), RegisterResponse, useAuth(), fetchUserPlan(), PlanContext, PlanContextValue, PlanProvider(), UserPlan (+2 more)

### Community 38 - "quillTopicRef.ts"
Cohesion: 0.23
Nodes (12): TopicChip(), formatTopicRef(), insertTopicRefAt(), buildTopicChipElement(), DeltaLike, DeltaOp, fillChip(), plainTextToDeltaOps() (+4 more)

### Community 39 - "command.tsx"
Cohesion: 0.22
Nodes (8): CommandDialog(), Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle()

### Community 40 - "WidgetApp.tsx"
Cohesion: 0.26
Nodes (12): SessionState, WidgetApp(), WidgetAppProps, clearStoredWidgetChatSession(), createPublicChatSession(), deletePublicChatSession(), getPublicChatSession(), getPublicWidget() (+4 more)

### Community 41 - "ArticleDrawer.tsx"
Cohesion: 0.20
Nodes (7): ArticleDrawerProps, StatusPill(), SyncPill(), DrawerDetails(), DrawerDetailsProps, formatRelativeTime(), ArticleSyncStatus

### Community 42 - "index.tsx"
Cohesion: 0.22
Nodes (5): FinalCta(), HeroSection(), TRUST_ROW_1, TRUST_ROW_2, Route

### Community 43 - "route.tsx"
Cohesion: 0.22
Nodes (7): CAPABILITY_LABELS, SandboxCapabilityGateProps, CapabilitiesResponse, PublicCapability, ProjectLayoutError(), ProjectLayoutPending(), Route

### Community 44 - "chat.tsx"
Cohesion: 0.18
Nodes (5): formatCapabilityList(), SandboxCapabilityGate(), Route, Route, Route

### Community 45 - "HomeCanvasBuilder.tsx"
Cohesion: 0.25
Nodes (9): ElementPalette(), ElementPaletteProps, ITEMS, createElement(), HomeCanvasBuilder(), HomeCanvasBuilderProps, defaultElementLayout(), HomeElementType (+1 more)

### Community 46 - "WidgetArticleReader.tsx"
Cohesion: 0.27
Nodes (10): escapeAttr(), sanitizeArticleHtml(), topicBodyHtml(), WidgetArticleReader(), WidgetArticleReaderProps, topicContentToHtml(), getPublicWidgetArticle(), PublicArticleDetail (+2 more)

### Community 47 - "JsonTemplateBuilder.tsx"
Cohesion: 0.31
Nodes (6): JsonTemplateBuilderProps, Button(), buttonVariants, JSON_FIELD_TYPES, JsonFieldNode, JsonFieldType

### Community 48 - "SideDrawer.tsx"
Cohesion: 0.29
Nodes (6): BODY_SIZE, PANEL_SIZE, PANEL_SIZE_WITH_DETAILS, SideDrawer(), SideDrawerProps, SideDrawerSize

### Community 49 - "HomeChromeUploads.tsx"
Cohesion: 0.33
Nodes (4): fetchOwnedPreviewUrl(), HomeChromeUploadsProps, MediaSlot(), WidgetMediaType

### Community 50 - "router.tsx"
Cohesion: 0.33
Nodes (5): getRouter(), Register, @tanstack/react-router, Register, routeTree

## Knowledge Gaps
- **331 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+326 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report**    run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `article.ts`, `McpSection.tsx`, `WidgetRuntimeContext.tsx`, `GuidanceContentEditor.tsx`, `job.ts`, `utils.ts`, `articleContent.ts`, `TrainTestAgentPanel.tsx`, `ProjectSidebar.tsx`, `PlansAdminForm.tsx`, `ProjectSectionPlaceholder.tsx`, `utils.ts`, `HomeCanvasRenderer.tsx`, `brandingContext.tsx`, `GuidanceSection.tsx`, `ApiKeysSection.tsx`, `WidgetBuilder.tsx`, `UsersAdminForm.tsx`, `SandboxChatForm.tsx`, `SandboxOcrForm.tsx`, `TranslateLanguageCombobox.tsx`, `TopicRichEditor.tsx`, `ui-classes.ts`, `authContext.tsx`, `VariableReferencePicker.tsx`, `ToggleRow.tsx`, `quillTopicRef.ts`, `command.tsx`, `WidgetApp.tsx`, `ArticleDrawer.tsx`, `route.tsx`, `HomeCanvasBuilder.tsx`, `WidgetArticleReader.tsx`, `JsonTemplateBuilder.tsx`, `SideDrawer.tsx`, `HomeChromeUploads.tsx`?**
  _High betweenness centrality (0.299) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `article.ts` to `authContext.tsx`, `cn`, `VariableReferencePicker.tsx`, `McpSection.tsx`, `planContext.tsx`, `widget.ts`, `route.tsx`, `TrainTestAgentPanel.tsx`, `PlansAdminForm.tsx`, `brandingContext.tsx`, `GuidanceSection.tsx`, `ApiKeysSection.tsx`, `UsersAdminForm.tsx`, `ui-classes.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `parseContentToBlocks()` connect `contentReferences.ts` to `article.ts`, `VariableReferencePicker.tsx`, `GuidanceContentEditor.tsx`, `quillTopicRef.ts`, `articleContent.ts`, `TrainTestAgentPanel.tsx`, `WidgetArticleReader.tsx`, `TopicRichEditor.tsx`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _331 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routeTree.gen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.037037037037037035 - nodes in this community are weakly interconnected._
- **Should `article.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09042553191489362 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._