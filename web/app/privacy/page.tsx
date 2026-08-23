import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & Publication — GO Society",
  description:
    "How GO Society protects enterprise feedback and publishes only de-identified, consent-scoped, human-approved evidence.",
};

const neverPublic = [
  "企业、决策者、员工或管理咨询师的真实姓名",
  "邮箱、电话、社交账号、地址与其他联系方式",
  "原始录音、录像、逐字稿、会议截图与内部文件",
  "未经授权的逐字引用、商业秘密与未公开经营数据",
  "可能造成重识别的精确日期、地点、金额、岗位或罕见特征组合",
];

const checklist = [
  "原始记录仍在私有数据层",
  "企业与个人使用不可反向推断的别名或角色类别",
  "已处理姓名、联系方式、精确时间、地点、金额和独特线索",
  "已检查个人信息与多项信息组合后的重识别风险",
  "匿名分析与匿名公开的授权范围已经区分",
  "具名、获授权的人类审核者已批准公开版本",
  "来源、转换、审批、版本、更正和撤回均可审计",
];

export default function PrivacyPage() {
  return (
    <main className="policy-shell">
      <header className="policy-topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">GO<span>/</span></span>
          <span><strong>GO Society</strong><small>Privacy & publication</small></span>
        </Link>
        <Link href="/">← Back to runtime</Link>
      </header>

      <article className="policy-document">
        <div className="policy-hero">
          <p className="eyebrow">Policy · v0.1</p>
          <h1>Private by default.<br />Public by accountable design.</h1>
          <p>
            默认私有；只有独立生成的脱敏版本，在完成授权范围确认、重识别风险检查和具名人类审批后，才可能公开。
          </p>
        </div>

        <section>
          <p className="eyebrow">The invariant</p>
          <h2>公开接口无法读取原始访谈。</h2>
          <p>
            GO Society 使用结构隔离的两类记录：私有原始记录用于内部学习；公开案例是单独创建的、经过脱敏和审核的发布物。Agent
            可以辅助整理与检查，但不能批准公开。
          </p>
          <div className="policy-flow">
            <span>Private intake</span><i>→</i><span>De-identification</span><i>→</i>
            <span>Consent + risk review</span><i>→</i><span>Named human approval</span><i>→</i>
            <span>Public evidence</span>
          </div>
        </section>

        <div className="policy-grid">
          <section>
            <p className="eyebrow">Data minimization</p>
            <h2>最少收集，身份与内容分离。</h2>
            <p>
              只收集任务真正需要的信息。能不记录姓名、联系方式、精确企业信息和原始录音，就不记录。企业、决策者、咨询师默认使用别名、角色类别或概括描述；不确定是否存在重识别风险时，保持私有。
            </p>
          </section>
          <section>
            <p className="eyebrow">Evidence status</p>
            <h2>一次访谈不是案例。</h2>
            <p>
              公开材料必须标注为 <code>Signal</code>、<code>Probe</code> 或 <code>Validated Case</code>。未经验证的反馈不能被包装成已验证成果，也不能因传播价值而绕过证据门槛。
            </p>
          </section>
        </div>

        <section className="policy-dark">
          <p className="eyebrow">Never public by default</p>
          <h2>以下内容不会进入公开页面、公开 API、仓库或衍生媒体：</h2>
          <ul>
            {neverPublic.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section>
          <p className="eyebrow">Publication gate</p>
          <h2>发布检查清单</h2>
          <ul className="policy-checklist">
            {checklist.map((item) => <li key={item}><span>□</span>{item}</li>)}
          </ul>
        </section>

        <section>
          <p className="eyebrow">Consent, correction, revocation</p>
          <h2>匿名参与、匿名公开和具名公开是三种不同授权。</h2>
          <p>
            参与者可以要求更正不准确的信息、撤回尚未发布的反馈、撤销未来使用授权，或对存在识别与伤害风险的公开内容提出下架。收到合理请求后，GO
            Society 先暂停传播，再核查、修订或下架；审计记录本身也不得继续暴露被撤回的信息。
          </p>
        </section>

        <footer>
          <strong>Human sovereignty includes privacy sovereignty.</strong>
          <span>GO Society · Living on GO OS</span>
        </footer>
      </article>
    </main>
  );
}
