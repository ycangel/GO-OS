# GO OS — 重新发明组织

> **愿景：重新发明组织。**  
> **使命：让组织自我进化。**

**当前版本：** `v0.5.0` — **Foundation Release（奠基版本）**

[English](README.md) · [文档总入口](docs/INDEX.md) · [快速开始](docs/QUICK_START.md) · [发布说明](docs/RELEASE_NOTES_v0.5.0.md)

**GO OS（Godel Organization Operating System / 哥德尔组织操作系统）** 是一个面向**自我进化组织**的开放组织智能操作系统。

AI 正在让智能从稀缺资源变成越来越丰富的基础能力。下一场真正深刻的变化，不只是把 Copilot、Agent 和大模型塞进旧流程，而是改变**组织本身是什么**：组织如何感知现实、形成认知、分配权力、采取行动、从经验中学习、保留记忆，并安全地改写自己的结构。

GO OS 从一个根本问题出发：

> **智能如何成为组织的一部分？**

答案不是“增加更多 Agent”。而是建立一种新的组织 Runtime：人保留对目的、责任、价值判断与不可逆后果的主权；机器在明确授权内获得真实行动权；现实持续产生证据；学习最终能够反过来改变组织自身。

> **Human Sovereignty × Machine Agency × Reality as Final Arbiter**  
> **人的主权 × 机器的行动权 × 现实拥有最终仲裁权**

本文中的 **Foundation Release 统一译为“奠基版本”**，指后续版本可以在其上演进的软件与架构基线。它不表示存在名为 “GO Foundation / GO 基金会” 的组织，也不暗示已经注册基金会或其他法律实体。

---

## 第三次组织文明

人类组织的历史，本质上也是协调技术不断变化的历史。

### 第一阶段：关系共同体

小规模组织依赖血缘、信任、声誉、共同经验和直接的人际关系协同。它拥有很强的共同语境，但难以规模化。

### 第二阶段：层级组织

工业时代通过层级、岗位、部门、流程、审批和管理制度实现大规模协作。它的优势是可复制、可控制；它的局限则是僵化：信息向上汇聚，决策向下传递，而现实变化往往快于组织反应。

### 第三阶段：自我进化组织

当智能越来越丰富、Machine Agency 越来越可行，组织可以从一个被管理的层级结构，转变为一个**递归学习系统**。

人在其中定义目的、承担责任；机器观察、推理、协作和行动；现实返回证据；Exception 暴露失效的假设；组织记忆保存学习；最终，组织更新自己的 Mission、Capability、Authority、Policy 与 Structure。

组织不再被设计一次，然后长期管理。

**组织持续设计自己。**

这就是 GO OS 希望推动和验证的新组织范式。

---

## 从“AI + 旧组织”到组织智能

大多数企业 AI 转型从这里开始：

`旧组织 + AI 工具`

GO OS 从另一个起点出发：

`人的目的 + 机器行动权 + 现实反馈 → 自我进化组织`

因此，GO OS 不把 Task 视为组织最底层的对象。

Task 只回答“下一步做什么”。一个真正能够自我进化的组织还必须持续回答：

- 我们究竟在推动什么 Mission？
- 谁或什么 Agent 有权行动？
- 组织当前相信什么？
- 哪些 Evidence 支持或反驳这些认知？
- 哪些 Exception 说明原有模型已经失效？
- 我们究竟学到了什么？
- 什么能力应该因此被沉淀和复用？
- 组织的哪一部分应该改变？

GO OS 尝试把这些问题编译成 Runtime Object、机器可读协议与可执行边界。

---

## v0.5 权威文档入口

[`docs/INDEX.md`](docs/INDEX.md) 是 v0.5 文档的权威总入口。仓库保留早期版本文档作为设计历史；只有当该索引明确指定时，早期文档才继续作为当前版本的权威依据。

| 从这里开始 | 用途 |
|---|---|
| [快速开始](docs/QUICK_START.md) | 运行一个小型、有边界的 GO OS 闭环，并检查 Reference Assets。 |
| [架构概览](docs/ARCHITECTURE_OVERVIEW.md) | 理解架构层、核心对象、执行边界与当前实现覆盖度。 |
| [白皮书编辑结构（未发布正文）](docs/WHITEPAPER.md) | 审阅拟议论证、证据义务与研究议程；这还不是已经发布的白皮书正文。 |
| [v0.5.0 发布说明](docs/RELEASE_NOTES_v0.5.0.md) | 区分本次发布已经包含的基线与尚未声称完成的能力。 |
| [迁移与弃用说明](docs/MIGRATION_AND_DEPRECATION_v0.5.0.md) | 更新来自早期文档、术语和接口的引用。 |
| [评测与红队](docs/EVALUATION_AND_RED_TEAM_v0.5.0.md) | 复现评测、提交反例并准备对抗性评审。 |

---

## GO OS 宪法

GO OS 建立在三个基础原则之上。

### 1. Human Sovereignty / 人的主权

人最终负责：目的、价值判断、资源承诺、组织宪法边界与不可逆后果。

AI 可以分析、挑战、规划、执行和提出建议，但智能本身不会自动带来主权。

### 2. Machine Agency / 机器的行动权

机器不应该永远只是等待下一条指令的被动助手。

在明确授权范围内，Agent 可以规划、执行、协作、验证、学习并提出组织变化建议。Authority 必须是明确的、有边界的、可撤销的、可审计的。Agent 不能静默扩大自己的权限。

### 3. Reality as Final Arbiter / 现实拥有最终仲裁权

层级、资历、权威、模型置信度，甚至语言表达能力，都不能决定什么是真的。

现实决定。

Evidence 可以反驳计划、领导者、Agent 以及整个组织已经形成的假设。一个真正有生命力的组织，必须在结构上允许这种反驳进入自身并推动学习。

权威宪法文档见 [`docs/GO_OS_CONSTITUTION_v0.2.2.md`](docs/GO_OS_CONSTITUTION_v0.2.2.md)。

---

## 组织智能闭环

GO OS 最初的运行闭环是：

`Purpose → Mission → Authority → Action → Reality → Evidence → Learning → Adaptation`

随着 Runtime 演化，我们把 Cognitive Loop 显式加入：

```text
Purpose / 目的
    ↓
Mission + Authority
    ↓
Action / 行动
    ↓
Reality / 现实
    ↓
Evidence / 证据
    ↓
Cognitive Event / 认知事件
    ↓
Human–AI Deliberation / 人机共同推理
    ↓
Learning / 学习
    ↓
Evolution Proposal / 进化提案
    ↓
Cognitive Commit / 认知提交
    ↓
Updated Organization / 更新后的组织
    ↺
```

GO OS 的核心因此不是流程自动化，而是：

> **递归的组织学习与自我改写。**

---

## 八个核心 Runtime Objects

v0.5 参考架构确立八个 Runtime 核心对象：

| 对象 | 含义 |
|---|---|
| **Mission** | 组织承诺推动的结果，包括目的与成功条件。 |
| **AuthorityGrant** | 人或机器改变组织状态所获得的明确、有边界、可撤销授权。 |
| **Evidence** | 可以被追溯，并能够支持、反驳或更新组织认知的现实观察。 |
| **CognitiveEvent** | 当证据冲突、异常、不确定性或能力缺口要求组织重新思考时产生的认知事件。 |
| **DeliberationSession** | 围绕假设、证据、替代解释与决策展开的结构化 Human–AI 推理过程。 |
| **LearningRecord** | 从经验中产生、可以复用的组织认知更新。 |
| **EvolutionProposal** | 基于学习结果，对能力、规则、权限、结构等组织状态提出的可追溯改变建议。 |
| **CognitiveVersion** | 对组织信念、假设、决策、开放问题和学习历史进行版本化保存的认知快照。 |

State、Exception、Capability 与 Organizational Memory 等早期核心概念仍然是 GO OS 的重要领域对象；以上八个对象构成 v0.5 Reference Runtime 的冻结内核。

---

## 架构

```text
 人 / Agent / 物理世界
          │
          ▼
   Cognitive Interface Layer
 ChatGPT · Claude · DeepSeek · GO Web
 Voice · 企业系统 · Robot
          │
          ▼
   Cognitive Interface Adapters
          │
          ▼
       Headless GO Core
          │
 ┌────────┼────────┐
 ▼        ▼        ▼
Authority Evidence Cognition
Runtime   Runtime  Runtime
 │         │        │
 └────────┼────────┘
          ▼
     Deliberation
          ▼
 Organizational Memory
          ▼
    Evolution Runtime
          ▼
   Cognitive Repository
          │
          └────────────↺
```

GO OS 被设计成一个 **Headless Core**。

ChatGPT、Claude、DeepSeek、GO Web、传统企业软件、摄像头、麦克风、机器人或其他现实世界接口，都可以成为组织智能的入口。

界面可以替换。

**组织智能不能因此消失。**

---

## Cognitive Portability / 认知可迁移性

GO OS 的一个核心原则是：

> **组织智能应该属于组织，而不是属于某个 AI 平台。**

聊天记录本身不是组织智能。真正应该长期拥有的是聊天背后的结构化认知状态：

- Purpose；
- Beliefs 与 Assumptions；
- Evidence；
- 重要 Decisions；
- Reasoning Patterns；
- Open Questions；
- Learning Records；
- Evolution History。

GO Cognitive Package 与 Cognitive Interface Adapter 的目标，是让这些认知资产能够跨 AI 系统迁移。

互联网时代，软件逐渐可迁移。

云时代，数据逐渐可迁移。

智能时代，GO OS 希望推动下一种基础能力：

**认知可迁移。**

---

## Cognitive Repository：组织智能的 Git

传统企业会保存文件和决策，却经常丢失一个更重要的东西：

> **组织为什么会形成今天的理解。**

GO OS 引入 **Cognitive Repository / 认知仓库**，对组织智能进行版本控制。

它与 Git 的类比是有意的，但并非机械复制：

| Git | GO Cognitive Repository |
|---|---|
| Source Repository | Cognitive Repository |
| Commit | Cognitive Commit |
| Diff | Cognitive Diff |
| Branch | 不同假设 / 战略分支 |
| Merge | 基于 Evidence 的认知收敛 |
| History | 组织理解世界的演化历史 |

一个 Cognitive Commit 应该回答：

> 我们的理解发生了什么变化？为什么变化？什么证据推动了变化？谁对最终决策负责？

因此，组织保存的不再只是**知道什么**，还包括**如何学会的**。

真正强大的组织，不只是拥有更多信息，而是不断提升自己的学习能力。

---

## GO OS 被设计为运行于 GO OS

自我应用是 GO OS 的运行承诺与可证伪策略。在 v0.5 中，以下内容是自我
应用计划与参考记录，不是完整 Runtime Loop 已经运行、更不是已经产生长期
组织结果的证据。

**GO Cognitive Repository #001** 是用于保存 GO OS 自身认知演化的参考
记录：核心 Beliefs、架构 Decisions、Cognitive Commits 与 Open Questions。

**GO Society Runtime Instance #001** 则是第一个按照完整 Runtime Loop 设计的组织实例：

```text
Reality
→ Evidence
→ Cognitive Event
→ Deliberation
→ Learning
→ Evolution Proposal
→ Cognitive Commit
→ Updated State
```

这件事非常重要。

因为一个关于“自我进化组织”的理论，最强的验证方式，就是看它能否发现并修正自己的缺陷。

因此 GO OS 应该始终保持可证伪性：

> GO OS 自己的运行历史，既可以成为支持它的 Evidence，也可以成为反驳它的 Evidence。

---

## GO Society

**GO Society 是 GO OS 的首个参考组织实例与 alpha 自我应用界面。**
这个名称指项目共同体与参考实例，本身不表示已经存在一个独立法律实体。

> **A self-evolving organization for self-evolving organizations.**  
> **一个推动组织自我进化、并首先进化自身的组织。**

GO Society 不是一个与协议脱节的展示站。它的计划是运行有边界的 Mission、
验证 Authority、收集 Evidence、暴露 Exception、进行 Human–AI Reasoning，
并提出对运行自身的 GO OS 的修改建议。哪些部分已经实现或验证，以
[Web README](web/README.md) 与发布说明中的状态为准。

- **Reference Application：**[`/web`](web)
- **当前生态与治理边界：**
  [`docs/ECOSYSTEM_AND_GOVERNANCE_BOUNDARY.md`](docs/ECOSYSTEM_AND_GOVERNANCE_BOUNDARY.md)
- **历史创立 Charter：**
  [`docs/GO_SOCIETY_OPERATING_CHARTER_v0.1.md`](docs/GO_SOCIETY_OPERATING_CHARTER_v0.1.md)

---

## 为什么叫 Godel Organization？

**GO = Godel Organization（哥德尔组织）。**

名字取意于 [Kurt Gödel（库尔特·哥德尔）](https://en.wikipedia.org/wiki/Kurt_G%C3%B6del)。他是二十世纪最重要的逻辑学家之一，以“不完备定理”闻名。

极度简化地说，哥德尔揭示了足够强的形式系统所具有的内在边界：一个固定的形式系统无法仅依赖自身既有规则解决其中一切可以表达的问题。

GO OS 借用的是这种思想的**组织隐喻**，而不是声称数学定理与组织理论完全等价。

任何足够复杂的组织，都不应该相信一套固定层级、制度、流程或管理理论能够永久处理未来所有情况。现实终究会产生原有模型没有预见的 Exception。

因此，一个真正有生命力的组织必须能够：

- 观察自身与外部世界；
- 发现矛盾和异常；
- 质疑自身假设；
- 吸收 Evidence；
- 保存 Learning；
- 在安全边界内改写自己。

而 GO 还有一个更简单的含义：

**Go. Test. Learn. Evolve.**  
**出发。验证。学习。进化。**

---

## Skill System

GO OS 当前包含 **1 个语义入口 + 8 个专业 Skills**，目标是让 Agent / Codex / AI 系统能够直接运行 GO OS 方法，而不是只阅读一套管理理论。

| Skill | 作用 |
|---|---|
| `go-os-core` | 识别表层问题背后的组织问题，并路由到合适的 GO OS 能力。 |
| `ai-native-organization-design` | 从岗位、层级、流程中心转向 Mission、Authority、Learning Loop 与 Capability。 |
| `human-sovereignty-machine-agency` | 定义人的责任、机器行动空间与升级边界。 |
| `mission-organizational-runtime` | 将意图编译成可运行的 Mission、Authority、State 与 Evidence。 |
| `reality-loop-organizational-learning` | 提高组织从 Reality 中学习和修正的速度。 |
| `vision-driven-strategy` | 把战略变成持续演化的假设—行动—证据闭环。 |
| `intelligent-compounding-ai-native-business` | 设计智能与能力随着使用持续复利的商业系统。 |
| `ai-native-talent-human-value` | 在机器智能丰富的时代重新定义人的价值。 |
| `ai-native-organization-diagnostic` | 诊断组织瓶颈并生成 AI 原生转型路径。 |

---

## Machine-readable Protocols

GO OS 不只希望成为哲学框架，还必须能够执行。

当前 v0.5 权威 Schema 集覆盖全部八个冻结核心对象：

- `Mission`
- `AuthorityGrant`
- `Evidence`
- `CognitiveEvent`
- `DeliberationSession`
- `LearningRecord`
- `EvolutionProposal`
- `CognitiveVersion`

`Exception` 与 `CognitiveCommit` 是支撑性 Contract。根目录早期 Schema 继续作为 v0.2 兼容资产保留；新的集成应从 [v0.5 Schema 索引](schemas/README.md) 与 [Manifest](schemas/v0.5/manifest.json) 开始。

这些 Contract 是组织原则进入 Runtime Enforcement 的桥梁。

---

## 如何开始

建议先完成权威的[快速开始](docs/QUICK_START.md)，再根据你的工作选择下面的入口。

### 如果你是企业领导者或组织设计者

从这份 README 和 Constitution 开始。选择一个真实、反复发生、风险可控的 Mission，定义 Purpose、Authority、Evidence 与 Exception。不要从“把现有组织架构数字化”开始。

### 如果你在构建 Agent / AI 系统

安装 `skills/go-os-core/SKILL.md`，再按需要增加专业 Skills。把 Schema 当作 Contract，并确保任何改变组织状态的动作首先通过 Authority Boundary。

### 如果你是开发者

先阅读[架构概览](docs/ARCHITECTURE_OVERVIEW.md)，再进入 [`/web`](web)、[`/schemas`](schemas) 与 [`/tests`](tests)。Reference Application 已实现部分 Runtime Boundary，但这并不证明 v0.5 的每个架构对象都已经达到生产完成度。

### 如果你是研究者或贡献者

挑战它。寻找反例。设计对抗场景。攻击它的理论漏洞。改进 Schema、Runtime、Eval 与 Reference Implementation。

GO OS 应该因为批评而变得更强，而不是因为共识而变得更舒服。

---

## GO OS 不是什么

GO OS **不是**：

- 带 AI 功能的项目管理软件；
- 套上组织术语的 Agent 编排框架；
- 数字化组织架构图；
- 对人类责任的替代；
- 让 AI 自主统治组织的主张；
- 一套固定不变的管理方法论。

它试图建立的是一个开放的组织运行模型和 Runtime，使组织能够持续感知、推理、行动、学习和进化，同时保留 Human Sovereignty。

---

## v0.5.0 Foundation Release（奠基版本）

**v0.5.0** 是 GO OS 第一个明确命名为 **Foundation Release（奠基版本）** 的发布。

这里的“奠基版本”只表示**软件与架构基线版本**。它不是基金会名称，不是在宣布成立 “GO Foundation / GO 基金会”，也不表示已经注册基金会或其他法律实体。

这次发布标志着 GO OS 从探索性的组织理论，收敛到一套围绕以下内容建立的参考架构：

- 组织宪法边界；
- 组织 Runtime Objects；
- Human–AI Cognitive Loop；
- Cognitive Portability；
- 组织认知的版本控制；
- 通过 GO Cognitive Repository #001 与 GO Society 开展自我应用。

它是一个继续构建和验证的起点，不是“已经完成”的声明。

| 发布范围 | v0.5.0 状态 |
|---|---|
| 宪法模型、核心 Ontology 与参考架构 | 已作为 v0.5 基线发布。 |
| Schema、Skills、Evaluation 与 GO Society Web | 已提供参考资产，但各部分实现深度并不相同。 |
| 认知可迁移、Cognitive Repository 语义与自我应用 | 已形成规格与参考材料；跨系统互操作和长期真实运行效果仍待验证。 |
| 面向组织自主治理的生产就绪能力 | 不作此声明；仍需人的批准、有边界的授权和具体场景验证。 |

下一阶段将继续提升 Runtime 的可执行性、互操作性、可测试性，以及在真实组织中的有效性。

已发布内容与边界见[发布说明](docs/RELEASE_NOTES_v0.5.0.md)，兼容性变化见[迁移与弃用说明](docs/MIGRATION_AND_DEPRECATION_v0.5.0.md)。

---

## 路线图

```text
v0.5.0  Foundation Release（奠基版本）
        ↓
v0.6    Runtime + SDK Beta
        ↓
v0.8    Multi-organization / Community Runtime
        ↓
v1.0    Production Self-Evolving Organization Runtime
```

除 v0.5.0 已发布基线外，后续版本均为方向性计划，不构成已经实现或承诺交付的事实。

长期目标可以用一句话表达，但实现并不容易：

> **一个组织不仅应该改进自己做什么，还应该改进自己如何实现改进。**

---

## 参与贡献

GO OS 是一个开放项目。贡献可以是代码、Skills、Schemas、Evaluation、组织实验、批评与新的 Reference Implementation。

最有价值的贡献不一定是更多代码。它也可能是更强的证伪测试、更清晰的 Authority Model、能够击穿现有假设的真实 Exception，或一种让组织更有效学习的方法。

见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。红队优先事项与证据要求见[评测与红队](docs/EVALUATION_AND_RED_TEAM_v0.5.0.md)。

---

## 作者

**Angelo Yu**

Founder & CEO, PIX Moving

angelo@pixmoving.com

**灌木丛（Guanmucong）**

AI Collaborator

见 [`AUTHORS.md`](AUTHORS.md)。

---

## 许可证

软件与机器可执行支持文件采用 Apache License 2.0；文档与 Skill 文本采用 CC BY 4.0。见 [`LICENSE`](LICENSE) 与 [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md)。

---

# Reinvent Organizations.

# 重新发明组织。

**GO — Enable organizations to evolve themselves.**
