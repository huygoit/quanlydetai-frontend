Bạn là senior frontend engineer Ant Design Pro (Umi + React + TS + ProComponents).

Bối cảnh:
- Trang danh mục hệ thống: src/pages/admin/catalog/index.tsx (đang rỗng hoặc mới có layout title).
- Cần thêm module quản trị “Loại kết quả NCKH” dạng cây + rule quy đổi.
- API backend Adonis (wrapper JSON):
  Success: { success: true, data: ... } hoặc { success: true, message: ... }
  Error:   { success: false, message: ... }

API base: /api/admin
Endpoints (camelCase fields):
1) GET  /research-output-types/tree
2) POST /research-output-types
3) PUT  /research-output-types/:id
4) DELETE /research-output-types/:id (?cascade=1 optional)
5) PUT  /research-output-types/:id/move
6) GET  /research-output-types/:id/rule (404 => {success:false,message:"Loại này chưa có rule."})
7) PUT  /research-output-types/:id/rule

Tree node:
{ id, code, name, level(1-3), sortOrder, isActive, hasRule, children: [] }

Rule DTO:
{ id, typeId, ruleKind, pointsValue?, hoursValue?, hoursMultiplierVar?, hoursBonus?, meta, evidenceRequirements?, createdAt, updatedAt }

ruleKind enum:
FIXED | MULTIPLY_A | HDGSNN_POINTS_TO_HOURS | MULTIPLY_C | RANGE_REVENUE | BONUS_ADD

==================================================
1) TẠO FILES
==================================================

A) Update page:
- src/pages/admin/catalog/index.tsx
=> hiển thị Tabs, trong đó có tab “Loại kết quả NCKH”.

B) Create screen:
- src/pages/admin/catalog/ResearchOutputTypes.tsx

C) Components:
- src/components/ResearchOutputTypes/TreePanel.tsx
- src/components/ResearchOutputTypes/TypeForm.tsx
- src/components/ResearchOutputTypes/RuleForm.tsx
- src/components/ResearchOutputTypes/MoveModal.tsx
- src/components/ResearchOutputTypes/DeleteModal.tsx

D) Services:
- src/services/researchOutputTypes.ts

E) Types:
- src/types/researchOutputs.ts

==================================================
2) UI TRANG DANH MỤC HỆ THỐNG (index.tsx)
==================================================

Trong src/pages/admin/catalog/index.tsx:
- Render PageContainer title="Danh mục hệ thống"
- Render Tabs:
  - Tab key="research-output-types" label="Loại kết quả NCKH"
    -> <ResearchOutputTypes />
  (có thể thêm placeholder tab khác nhưng không bắt buộc)

==================================================
3) SCREEN ResearchOutputTypes (VIP PRO)
==================================================

Layout 2 cột:
- Left (360px): TreePanel
- Right: Detail panel (TypeForm + RuleForm)

TreePanel:
- Search input filter tree by code/name (client-side)
- Buttons:
  - “Thêm nhóm (Level 1)” => open create modal/form with parentId=null, level=1
  - “Thêm mục con” => enabled when selected && selected.level < 3
  - “Reload” => refetch tree
- Tree render:
  title: "CODE — NAME"
  show tags:
    - Leaf (children.length===0)
    - Rule (hasRule)
    - Inactive (!isActive)

Detail panel:
- If none selected => <Empty />
- If selected:
  Card 1 “Thông tin loại kết quả”
    - TypeForm (edit selected)
    - Actions:
      - Lưu (POST/PUT)
      - Xoá (DeleteModal with cascade checkbox)
      - Di chuyển (MoveModal: newParentId + newSortOrder)
  Card 2 “Rule quy đổi”
    - Only if leaf:
      - Load rule by GET /:id/rule
      - If 404 "chưa có rule" => show Empty + button “Tạo rule”
      - Else show RuleForm editable + Save
    - If not leaf => show info alert: “Chỉ node lá (không có con) mới gắn rule.”

==================================================
4) CRUD & MOVE LOGIC (KHỚP API)
==================================================

- fetchTree() on mount
- select node:
  - setSelectedNode
  - if leaf => getRule(selected.id) else clear rule state

Create:
- Level 1: parentId=null, level=1
- Child: parentId=selected.id, level=selected.level+1
- POST /research-output-types

Update:
- PUT /research-output-types/:id
  payload uses camelCase

Delete:
- DeleteModal has checkbox cascade
- call DELETE /:id (append ?cascade=1 if checked)
- handle 409 conflict: show message and suggest cascade

Move:
- MoveModal:
  - Select newParentId (nullable for moving to root)
  - Input newSortOrder
  - UI validation: cannot exceed level 3 (use selected.level and chosen parent.level)
- call PUT /:id/move

After any mutation:
- refreshTree()
- try keep selection by id (find node in new tree)

==================================================
5) RULE FORM SPEC
==================================================

RuleForm fields by ruleKind:

FIXED:
- pointsValue (required)
- hoursValue (required)
- evidenceRequirements (optional)

MULTIPLY_A:
- hoursValue (required) label “Giờ cơ sở”
- pointsValue optional
- set hoursMultiplierVar="a" (hidden)
- evidenceRequirements

HDGSNN_POINTS_TO_HOURS:
- set meta.hours_per_point=600 (readonly UI)
- hoursValue can be auto set 600 (hidden/readonly)
- evidenceRequirements

MULTIPLY_C:
- pointsValue required
- hoursValue required
- hoursMultiplierVar="c"
- meta.c_map editor:
  - EXCELLENT, PASS_ON_TIME, PASS_LATE (all required numbers)

RANGE_REVENUE:
- EditableProTable meta.ranges:
  columns: min (number), max (number|null), points (number), hours (number)
  validation ordering + last max can be null

BONUS_ADD:
- pointsValue required
- hoursValue required
- hoursBonus required
- evidenceRequirements optional

Save rule:
PUT /research-output-types/:id/rule
- If 400 leaf error => message.error(message)
- On success => refresh tree to update hasRule

==================================================
6) SERVICES IMPLEMENTATION
==================================================

In src/services/researchOutputTypes.ts:

- baseRequest<T>(url, options) -> returns data or throws Error(message)
- For getRule:
  - if response.success=false and message contains “chưa có rule” => return null
  - else throw

Functions:
- fetchTree(): Promise<TreeNode[]>
- createType(payload): Promise<TypeDTO>
- updateType(id,payload): Promise<TypeDTO>
- deleteType(id, cascade?: boolean): Promise<void>
- moveType(id,payload): Promise<TypeDTO>
- getRule(typeId): Promise<RuleDTO|null>
- upsertRule(typeId, payload): Promise<RuleDTO>

Use existing request client of project (umi-request / @umijs/max request).
Do NOT use fetch directly unless project already does.

==================================================
7) OUTPUT
==================================================

Return full code for:
- src/pages/admin/catalog/index.tsx
- src/pages/admin/catalog/ResearchOutputTypes.tsx
- components/* (5 files)
- services/researchOutputTypes.ts
- types/researchOutputs.ts
No backend edits.