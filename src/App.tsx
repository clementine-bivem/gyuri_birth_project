import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type IdentityType = 'anonymous' | 'nickname' | 'name' | '';
type StepId = 'identity' | 'name' | 'met' | 'content' | 'coupon' | 'letter' | 'confirm';

type FormState = {
  identity_type: IdentityType;
  display_name: string;
  met_from: string;
  met_from_detail: string;
  wants_letter: boolean;
  wants_coupon: boolean;
  coupon_type: string;
  coupon_detail: string;
  letter_message: string;
};

type BirthdayMessage = {
  id: string;
  identity_type: 'anonymous' | 'nickname' | 'name';
  display_name: string | null;
  met_from: string;
  met_from_detail: string | null;
  wants_letter: boolean;
  wants_coupon: boolean;
  coupon_type: string | null;
  coupon_detail: string | null;
  letter_message: string | null;
  created_at: string;
};

const initialForm: FormState = {
  identity_type: '',
  display_name: '',
  met_from: '',
  met_from_detail: '',
  wants_letter: false,
  wants_coupon: false,
  coupon_type: '',
  coupon_detail: '',
  letter_message: '',
};

const metOptions = ['초등학교', '중학교', '고등학교', '겹강', '명중사격부', '지하철', '비밀', '기타'];
const detailMetOptions = ['겹강', '지하철', '기타'];
const couponOptions = ['밥 먹자 쿠폰', '카페 가자 쿠폰', '산책 하자 쿠폰', '줌으로 보자 쿠폰', '기타 쿠폰'];
const deadline = new Date('2026-07-05T15:00:00.000Z'); // 2026-07-06 00:00 KST

function isClosed() {
  return new Date().getTime() >= deadline.getTime();
}

function OrangeDecor() {
  return (
    <div className="orange-decor" aria-hidden="true">
      <span className="orange orange-a">🍊</span>
      <span className="orange orange-b">🍃</span>
      <span className="orange orange-c">✉️</span>
      <span className="orange orange-d">☀️</span>
      <span className="orange orange-e">🍊</span>
    </div>
  );
}

function App() {
  const pathname = window.location.pathname;
  return (
    <main className="app-shell">
      <OrangeDecor />
      {pathname.startsWith('/letters') ? <LettersPage /> : <PublicPage />}
    </main>
  );
}

function PublicPage() {
  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = sessionStorage.getItem('gyuriBirthdayDraft');
      return saved ? { ...initialForm, ...JSON.parse(saved) } : initialForm;
    } catch {
      return initialForm;
    }
  });
  const [step, setStep] = useState<StepId>('identity');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => localStorage.getItem('submittedBirthdayMessage') === 'true');

  useEffect(() => {
    sessionStorage.setItem('gyuriBirthdayDraft', JSON.stringify(form));
  }, [form]);

  const steps = useMemo(() => getSteps(form), [form]);
  const currentIndex = Math.max(0, steps.indexOf(step));
  const progress = ((currentIndex + 1) / steps.length) * 100;

  useEffect(() => {
    if (!steps.includes(step)) {
      setStep(steps[0]);
    }
  }, [steps, step]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  }

  function validateCurrent() {
    const message = validateStep(step, form);
    if (message) {
      setError(message);
      return false;
    }
    setError('');
    return true;
  }

  function next() {
    if (!validateCurrent()) return;
    const nextStep = steps[currentIndex + 1];
    if (nextStep) setStep(nextStep);
  }

  function previous() {
    const prevStep = steps[currentIndex - 1];
    if (prevStep) {
      setError('');
      setStep(prevStep);
    }
  }

  async function submit() {
    if (!validateCurrent()) return;
    if (!isSupabaseConfigured) {
      setError('Supabase 환경변수가 아직 연결되지 않았어요. Vercel에서 환경변수를 먼저 설정해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      identity_type: form.identity_type,
      display_name: form.identity_type === 'anonymous' ? null : form.display_name.trim(),
      met_from: form.met_from,
      met_from_detail: detailMetOptions.includes(form.met_from) ? form.met_from_detail.trim() : null,
      wants_letter: form.wants_letter,
      wants_coupon: form.wants_coupon,
      coupon_type: form.wants_coupon ? form.coupon_type : null,
      coupon_detail: form.wants_coupon && form.coupon_type === '기타 쿠폰' ? form.coupon_detail.trim() : null,
      letter_message: form.wants_letter ? form.letter_message.trim() : null,
    };

    const { error: insertError } = await supabase.from('birthday_messages').insert(payload);
    setSubmitting(false);

    if (insertError) {
      setError(`전송 중 문제가 생겼어요: ${insertError.message}`);
      return;
    }

    localStorage.setItem('submittedBirthdayMessage', 'true');
    sessionStorage.removeItem('gyuriBirthdayDraft');
    setSubmitted(true);
  }

  if (isClosed()) {
    return (
      <CenterCard>
        <StickerTitle eyebrow="closed" title="메시지 접수가 마감되었습니다" />
        <p className="soft-text">남겨준 마음은 규리가 소중히 열어볼게요 💌</p>
      </CenterCard>
    );
  }

  if (submitted) {
  return (
    <CenterCard>
      <StickerTitle eyebrow="sent" title="마음이 도착했어요 💌" />
      <p className="soft-text">
        소중한 마음을 남겨줘서 정말 고마워요.
        <br />
        남겨준 편지와 쿠폰은 7월 5일이 지나고 하나씩 천천히 열어볼게요.
        <br />
        덕분에 제 생일이 벌써 조금 더 다정하고 특별해졌어요 🍊
      </p>
      <p className="soft-text small">
        이제 창을 닫아도 괜찮아요.  
        혹시 내용을 꼭 수정하고 싶다면 규리에게 직접 말해주세요.
      </p>
    </CenterCard>
  );
}

  return (
    <section className="page-wrap">
      <header className="hero-card paper-card">
        <div className="mini-label">Gyuri's Birthday Mailbox</div>
        <h1>규리의 생일 편지함 🍊💌</h1>
        <p>
          곧 제 생일이라 작은 편지함 하나 만들어봤어요. 웃긴 말이든, 따뜻한 말이든, 갑자기 진지한 말이든 다 좋아요.
          엄청 친한 사이 아니어도 그냥 편하게 남겨줘도 돼요.
        </p>
        <p>
          편지 쓰기 좀 어렵다 싶으면 밥 먹기 쿠폰만 남겨도 됩니다 🍚 7월 5일 지나고 하나씩 열어볼게요.
        </p>
        <div className="privacy-note">남겨준 답변과 편지는 규리만 확인할 수 있어요. 다른 사람에게 공개되지 않으니 편하게 남겨주세요.</div>
      </header>

      <section className="wizard-card paper-card">
        <Progress steps={steps.length} current={currentIndex + 1} progress={progress} />
        {step === 'identity' && <IdentityStep form={form} update={update} />}
        {step === 'name' && <NameStep form={form} update={update} />}
        {step === 'met' && <MetStep form={form} update={update} />}
        {step === 'content' && <ContentStep form={form} update={update} />}
        {step === 'coupon' && <CouponStep form={form} update={update} />}
        {step === 'letter' && <LetterStep form={form} update={update} />}
        {step === 'confirm' && <ConfirmStep form={form} />}

        {error && <p className="error-message">{error}</p>}

        <div className="button-row">
          <button className="secondary-button" onClick={previous} disabled={currentIndex === 0 || submitting}>
            이전
          </button>
          {step === 'confirm' ? (
            <button className="primary-button" onClick={submit} disabled={submitting}>
              {submitting ? '보내는 중...' : '규리에게 보내기 💌'}
            </button>
          ) : (
            <button className="primary-button" onClick={next}>
              다음
            </button>
          )}
        </div>
      </section>
    </section>
  );
}

function getSteps(form: FormState): StepId[] {
  const result: StepId[] = ['identity'];
  if (form.identity_type !== 'anonymous') result.push('name');
  result.push('met', 'content');
  if (form.wants_coupon) result.push('coupon');
  if (form.wants_letter) result.push('letter');
  result.push('confirm');
  return result;
}

function validateStep(step: StepId, form: FormState) {
  if (step === 'identity' && !form.identity_type) return '어떻게 남길지 골라줘요 🍊';
  if (step === 'name' && form.identity_type !== 'anonymous' && !form.display_name.trim()) return '이름이나 닉네임을 적어줘요.';
  if (step === 'met') {
    if (!form.met_from) return '규리를 알게 된 곳을 골라줘요.';
    if (detailMetOptions.includes(form.met_from) && !form.met_from_detail.trim()) return '선택한 항목의 세부 내용을 적어줘요.';
  }
  if (step === 'content' && !form.wants_letter && !form.wants_coupon) return '편지나 쿠폰 중 하나는 남겨줘요 💌';
  if (step === 'coupon') {
    if (!form.coupon_type) return '어떤 쿠폰을 줄지 골라줘요.';
    if (form.coupon_type === '기타 쿠폰' && !form.coupon_detail.trim()) return '기타 쿠폰 내용을 적어줘요.';
  }
  if (step === 'letter') {
    if (!form.letter_message.trim()) return '편지를 한 줄 이상 남겨줘요.';
    if (form.letter_message.length > 2000) return '편지는 2000자 이하로 남겨줘요.';
  }
  return '';
}

function Progress({ steps, current, progress }: { steps: number; current: number; progress: number }) {
  return (
    <div className="progress-wrap">
      <div className="orange-dots">
        {Array.from({ length: steps }).map((_, idx) => (
          <span key={idx} className={idx < current ? 'dot active' : 'dot'}>
            🍊
          </span>
        ))}
      </div>
      <div className="progress-bar" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="step-count">{current} / {steps}</p>
    </div>
  );
}

function IdentityStep({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return (
    <StepLayout title="어떻게 남길래요?" subtitle="완전 익명도, 닉네임도, 이름도 모두 괜찮아요.">
      <RadioCard label="완전 익명으로 남길래요" checked={form.identity_type === 'anonymous'} onClick={() => update('identity_type', 'anonymous')} />
      <RadioCard label="익명인데 닉네임은 남길래요" checked={form.identity_type === 'nickname'} onClick={() => update('identity_type', 'nickname')} />
      <RadioCard label="이름 남길래요" checked={form.identity_type === 'name'} onClick={() => update('identity_type', 'name')} />
    </StepLayout>
  );
}

function NameStep({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  const label = form.identity_type === 'nickname' ? '닉네임' : '이름';
  return (
    <StepLayout title={`${label}을 적어주세요`} subtitle="나중에 규리가 알아보고 웃을 수 있게 남겨줘도 좋아요.">
      <input
        className="text-input"
        value={form.display_name}
        onChange={(e) => update('display_name', e.target.value)}
        maxLength={80}
        placeholder="이름이나 닉네임을 적어주세요"
      />
    </StepLayout>
  );
}

function MetStep({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return (
    <StepLayout title="규리를 알게 된 곳!" subtitle="어디서 이어진 인연인지 살짝 알려주세요.">
      <div className="option-grid">
        {metOptions.map((option) => (
          <RadioCard
            key={option}
            label={option}
            checked={form.met_from === option}
            onClick={() => {
              update('met_from', option);
              if (!detailMetOptions.includes(option)) update('met_from_detail', '');
            }}
          />
        ))}
      </div>
      {form.met_from === '겹강' && (
        <input className="text-input" value={form.met_from_detail} onChange={(e) => update('met_from_detail', e.target.value)} maxLength={200} placeholder="무슨 강의였나요?" />
      )}
      {form.met_from === '지하철' && (
        <input className="text-input" value={form.met_from_detail} onChange={(e) => update('met_from_detail', e.target.value)} maxLength={200} placeholder="무슨 지하철/역/상황이었나요?" />
      )}
      {form.met_from === '기타' && (
        <input className="text-input" value={form.met_from_detail} onChange={(e) => update('met_from_detail', e.target.value)} maxLength={200} placeholder="어디서 알게 되었나요?" />
      )}
    </StepLayout>
  );
}

function ContentStep({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return (
    <StepLayout title="남기고 싶은 것" subtitle="둘 다 남겨도 좋아요. 둘 다 선택하면 쿠폰을 먼저 받을게요.">
      <CheckCard label="생일 편지 남기기" checked={form.wants_letter} onClick={() => update('wants_letter', !form.wants_letter)} />
      <CheckCard label="여름에 얼굴 보자! 쿠폰 남기기" checked={form.wants_coupon} onClick={() => update('wants_coupon', !form.wants_coupon)} />
    </StepLayout>
  );
}

function CouponStep({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return (
    <StepLayout title="여름에 얼굴 보자!" subtitle="해당 쿠폰은 규리가 2026년 여름에 불시에 들이밀 예정입니다. 생일선물로 쿠폰을 주시다니! 최고의 선물 감사해요~">
      <div className="option-grid">
        {couponOptions.map((option) => (
          <RadioCard
            key={option}
            label={option}
            checked={form.coupon_type === option}
            onClick={() => {
              update('coupon_type', option);
              if (option !== '기타 쿠폰') update('coupon_detail', '');
            }}
          />
        ))}
      </div>
      {form.coupon_type === '기타 쿠폰' && (
        <input className="text-input" value={form.coupon_detail} onChange={(e) => update('coupon_detail', e.target.value)} maxLength={200} placeholder="어떤 쿠폰인가요?" />
      )}
    </StepLayout>
  );
}

function LetterStep({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return (
    <StepLayout
      title="생일 편지 남기기"
      subtitle="웃긴 드립, 따뜻한 말, 진지한 말 모두 환영! 근황 묻기나 질문폭격도 가능! 단, ‘생일 축하해~ 행복해~’ 같은 식상한 자동완성 멘트만 남기기? 절대 금지."
    >
      <textarea
        className="letter-area"
        value={form.letter_message}
        onChange={(e) => update('letter_message', e.target.value)}
        maxLength={2000}
        placeholder="하고 싶은 말, 웃긴 드립, 진심, 근황 질문, 추억, 응원… 아무거나 남겨주세요 💌"
      />
      <p className="char-count">{form.letter_message.length} / 2000</p>
    </StepLayout>
  );
}

function ConfirmStep({ form }: { form: FormState }) {
  const displayName = form.identity_type === 'anonymous' ? '완전 익명' : form.display_name;
  return (
    <StepLayout title="이렇게 규리에게 보낼게요" subtitle="빠진 게 있으면 이전으로 돌아가서 고칠 수 있어요.">
      <div className="summary-list">
        <SummaryItem label="이름" value={displayName} />
        <SummaryItem label="알게 된 곳" value={`${form.met_from}${form.met_from_detail ? ` · ${form.met_from_detail}` : ''}`} />
        <SummaryItem label="남기는 것" value={[form.wants_letter ? '편지' : '', form.wants_coupon ? '쿠폰' : ''].filter(Boolean).join(' + ')} />
        {form.wants_coupon && <SummaryItem label="쿠폰" value={`${form.coupon_type}${form.coupon_detail ? ` · ${form.coupon_detail}` : ''}`} />}
        {form.wants_letter && <SummaryItem label="편지" value={form.letter_message} long />}
      </div>
    </StepLayout>
  );
}

function StepLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="step-layout">
      <div className="step-sticker">🍊</div>
      <h2>{title}</h2>
      <p className="step-subtitle">{subtitle}</p>
      <div className="step-content">{children}</div>
    </div>
  );
}

function RadioCard({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button type="button" className={checked ? 'choice-card selected' : 'choice-card'} onClick={onClick}>
      <span className="choice-mark">{checked ? '●' : '○'}</span>
      {label}
    </button>
  );
}

function CheckCard({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button type="button" className={checked ? 'choice-card selected' : 'choice-card'} onClick={onClick}>
      <span className="choice-mark">{checked ? '✓' : '+'}</span>
      {label}
    </button>
  );
}

function SummaryItem({ label, value, long = false }: { label: string; value: string; long?: boolean }) {
  return (
    <div className={long ? 'summary-item long' : 'summary-item'}>
      <strong>{label}</strong>
      <span>{value || '-'}</span>
    </div>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return <section className="center-card paper-card">{children}</section>;
}

function StickerTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="sticker-title">
      <span>{eyebrow} · 🍊</span>
      <h1>{title}</h1>
    </div>
  );
}

function LettersPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function login() {
    if (!email.trim()) {
      setLoginMessage('이메일을 입력해주세요.');
      return;
    }
    if (!isSupabaseConfigured) {
      setLoginMessage('Supabase 환경변수가 아직 연결되지 않았어요.');
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/letters` },
    });
    if (error) setLoginMessage(`로그인 링크 전송 실패: ${error.message}`);
    else setLoginMessage('로그인 링크를 이메일로 보냈어요. 메일함을 확인해주세요 🍊');
  }

  if (loadingSession) {
    return <CenterCard><p className="soft-text">편지함을 여는 중이에요...</p></CenterCard>;
  }

  if (!session) {
    return (
      <CenterCard>
        <StickerTitle eyebrow="private" title="규리만 열 수 있는 편지함이에요 🍊" />
        <p className="soft-text">도착한 마음을 보려면 로그인해주세요.</p>
        <input className="text-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소" type="email" />
        <button className="primary-button full" onClick={login}>로그인 링크 받기</button>
        {loginMessage && <p className="soft-text small">{loginMessage}</p>}
      </CenterCard>
    );
  }

  return <LetterArchive session={session} />;
}

function LetterArchive({ session }: { session: Session }) {
  const [messages, setMessages] = useState<BirthdayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      const { data, error: selectError } = await supabase
        .from('birthday_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (selectError) setError(selectError.message);
      else setMessages((data ?? []) as BirthdayMessage[]);
      setLoading(false);
    }
    fetchMessages();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <section className="archive-wrap">
      <header className="archive-header paper-card">
        <div>
          <div className="mini-label">Private Orange Archive</div>
          <h1>규리의 귤 편지 보관함 🍊💌</h1>
          <p>{session.user.email}로 로그인 중</p>
        </div>
        <button className="secondary-button" onClick={logout}>로그아웃</button>
      </header>

      {loading && <CenterCard><p className="soft-text">편지함을 여는 중이에요...</p></CenterCard>}
      {error && <CenterCard><p className="error-message">편지함을 여는 중 문제가 생겼어요. {error}</p></CenterCard>}
      {!loading && !error && messages.length === 0 && (
        <CenterCard><p className="soft-text">아직 도착한 귤 편지가 없어요. 조금만 기다려볼까요? 🍊</p></CenterCard>
      )}
      {!loading && !error && messages.length > 0 && (
        <>
          <div className="count-pill">지금까지 {messages.length}개의 마음이 도착했어요 🍊</div>
          <div className="letters-grid">
            {messages.map((message) => <LetterCard key={message.id} message={message} />)}
          </div>
        </>
      )}
    </section>
  );
}

function LetterCard({ message }: { message: BirthdayMessage }) {
  const [open, setOpen] = useState(false);
  const sender = message.identity_type === 'anonymous' ? '완전 익명' : message.display_name || '이름 없음';
  const badge = message.wants_letter && message.wants_coupon ? '편지+쿠폰' : message.wants_letter ? '편지' : '쿠폰';

  return (
    <article className="letter-card paper-card">
      <button className="letter-top" onClick={() => setOpen((prev) => !prev)}>
        <div>
          <span className="badge">{badge}</span>
          <h2>{sender}</h2>
          <p>{formatDate(message.created_at)}</p>
        </div>
        <span className="fold-icon">{open ? '펼침 🍊' : '열기 ✉️'}</span>
      </button>
      {open && (
        <div className="letter-body">
          <SummaryItem label="알게 된 곳" value={`${message.met_from}${message.met_from_detail ? ` · ${message.met_from_detail}` : ''}`} />
          {message.wants_coupon && <SummaryItem label="쿠폰" value={`${message.coupon_type ?? ''}${message.coupon_detail ? ` · ${message.coupon_detail}` : ''}`} />}
          {message.wants_letter && <SummaryItem label="편지" value={message.letter_message ?? ''} long />}
        </div>
      )}
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export default App;
