# GO OS — Godel Organization Operating System

**版本：** v0.2.2  
**状态：** Public Alpha

## 组织正在发生什么变化

当机器智能逐渐变得丰富甚至趋于商品化，企业正在从工业时代的固定层级、静态岗位、流程和人工协调，转向一种新的组织形态：**递归自我迭代、自我进化的组织系统**。

在这种组织里，人负责目的、责任、价值边界与不可逆后果；机器与 Agent 获得广泛但有边界的行动权；现实持续产生证据；组织则不断更新自己的 Mission、能力、规则、结构与战略。

**GO OS 是推动这一新组织范式的开放框架、Skills 系统与正在形成的 Runtime 协议。**它试图让组织具备一种持续能力：感知现实 → 自主行动 → 获取证据 → 修正认知 → 更新能力与结构，同时不丢失人的主权。

GO OS 不是“传统项目管理软件 + Agent”，也与 Go 编程语言或操作系统工程无关。它把组织本身视为一个持续运行的智能系统。

> **Human Sovereignty × Machine Agency × Reality as Final Arbiter**  
> **人的主权 × 机器的行动权 × 现实拥有最终仲裁权**

核心运行回路：

`Purpose → Mission → Authority → Action → Reality → Evidence → Learning → Adaptation`

即：

`目的 → 使命 → 权限 → 行动 → 现实 → 证据 → 学习 → 适应`

## 为什么叫 GO？

**GO = Godel Organization（哥德尔组织）。**

名字取意于 [Kurt Gödel（库尔特·哥德尔）](https://en.wikipedia.org/wiki/Kurt_G%C3%B6del)。哥德尔是 20 世纪最重要的逻辑学家和数学家之一，以“不完备定理”闻名。用极度简化的方式说，他揭示了一个深刻事实：对于足够强的形式系统，固定规则本身存在内在边界，并不能在系统内部证明或解决关于自身的一切真命题。

GO OS 借用的是这种思想的**组织隐喻**，而不是把数学定理直接等同于组织理论：任何足够复杂的组织，都不应该相信一套固定制度、流程和结构能够永久解决未来所有问题。真正有生命力的组织，需要能够观察现实、识别异常、质疑自身假设、更新认知，并在安全边界内改写自身。

同时，**GO** 也意味着行动：出发、验证、学习、进化。

## GO OS 管理什么？

GO OS 不把 Task 作为组织的第一对象，而把以下对象作为更底层的组织原语：

- **Mission / 使命**：必须产生什么结果，以及为什么。
- **Authority / 权限**：谁或什么 Agent 可以做什么决定、承诺什么资源。
- **State / 状态**：对当前现实最好的表达。
- **Evidence / 证据**：什么事实支持、反驳或更新我们的判断。
- **Exception / 异常**：什么情况超出了原有假设、权限或正常运行边界。
- **Capability / 能力**：能够复用、积累并提高未来执行质量的能力。
- **Organizational Memory / 组织记忆**：被保留下来的决策、证据、模型、经验与模式。

GO OS 的权威宪法原则以 [`docs/GO_OS_CONSTITUTION_v0.2.2.md`](docs/GO_OS_CONSTITUTION_v0.2.2.md) 为唯一规范源。

## Skill 体系

当前由 **1 个语义入口 + 8 个专业 Skills** 组成：

| Skill | 作用 |
|---|---|
| `go-os-core` | 识别表层问题背后的组织问题，并路由到正确的 GO OS 能力。 |
| `ai-native-organization-design` | 从岗位、层级、流程中心转向使命、权限、Loop 与能力中心。 |
| `human-sovereignty-machine-agency` | 定义人的主权边界、机器行动空间和升级机制。 |
| `mission-organizational-runtime` | 将意图与战略编译成可持续运行的 Mission、Authority 与 Evidence。 |
| `reality-loop-organizational-learning` | 加快组织从现实中学习和修正的速度。 |
| `vision-driven-strategy` | 将战略变成持续运行的假设—行动—证据—更新系统。 |
| `intelligent-compounding-ai-native-business` | 设计让数据、智能、体验与能力持续复利的 AI 原生商业模式。 |
| `ai-native-talent-human-value` | 在智能丰富的时代重新定义人的价值、岗位与领导力。 |
| `ai-native-organization-diagnostic` | 对组织进行 AI 原生成熟度诊断并生成转型路径。 |

## 如何使用

### 1. 作为 Agent Skills 使用

将 `skills/go-os-core/SKILL.md` 与需要的专业 Skills 安装或复制到支持 Agent Skills 的环境中。建议从 `go-os-core` 开始，它会根据显式意图、真实问题信号和潜在结构信号触发并路由。

### 2. 作为组织设计框架使用

阅读 `/docs` 下的 Constitution、Open Framework、Architecture 与 Glossary，然后选择一个真实、反复发生、风险可控且证据丰富的 Mission 开始，而不是一次性重构整个企业。

### 3. 作为机器可读协议使用

使用 `/schemas` 下的 JSON Schema 表达 `MissionSpec`、`AuthorityGrant`、`EvidenceSpec` 和 `ExceptionSpec`，这是走向 GO Runtime 的第一组可执行接口。

## 仓库结构

```text
.
├── README.md
├── README.zh-CN.md
├── AUTHORS.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── VERSION
├── docs/
│   ├── GO_OS_CONSTITUTION_v0.2.2.md
│   ├── GO_OS_OPEN_FRAMEWORK_v0.1.0.md
│   ├── PRINCIPLES_v0.1.0.md
│   ├── ARCHITECTURE_v0.1.0.md
│   ├── GLOSSARY_v0.1.0.md
│   ├── SKILL_SPEC_v0.2.2.md
│   ├── SKILL_ROUTING_AND_CONTRACTS_v0.2.0.md
│   ├── RED_TEAM_REVIEW_v0.1.1.md
│   └── ROADMAP.md
├── schemas/
│   ├── mission-spec.schema.json
│   ├── authority-grant.schema.json
│   ├── evidence-spec.schema.json
│   ├── exception-spec.schema.json
│   └── examples/
├── skills/
│   ├── go-os-core/
│   └── ... eight specialist skills
└── tests/
    ├── eval-cases-v0.2.0.yaml
    ├── trigger-evals-v0.2.1.yaml
    └── evaluation-prompts.md
```

## 版本规则

采用 Semantic Versioning：

- `MAJOR`：核心本体或行为发生不兼容改变。
- `MINOR`：增加新能力、新对象或重大框架扩展。
- `PATCH`：澄清、测试、案例、一致性修复及非破坏性改进。

当前版本：**v0.2.2**。

## 作者

**Angelo Yu**  
Founder & CEO, PIX Moving  
angelo@pixmoving.com

**灌木丛 (Guanmucong)**  
AI Collaborator

---

**GO — Build organizations that can evolve themselves.**  
**GO —— 构建能够自我进化的组织。**
