# 규리의 생일 편지함 🍊💌

v0 결제 없이 쓰기 위한 Vite + React + Supabase 버전입니다.

## 1. Supabase 설정

1. Supabase 프로젝트를 만듭니다.
2. `supabase_setup.sql` 파일을 엽니다.
3. `YOUR_EMAIL@example.com`을 `/letters`에서 로그인할 본인 이메일로 바꿉니다.
4. Supabase SQL Editor에서 실행합니다.

## 2. 환경변수

`.env.example`을 참고해서 Vercel 환경변수에 아래 2개를 넣습니다.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Supabase Dashboard > Project Settings > API에서 확인할 수 있습니다.

## 3. 배포

Vercel에서 이 프로젝트를 Import하면 됩니다. Framework Preset은 Vite로 자동 인식됩니다.

- Build Command: `npm run build`
- Output Directory: `dist`

## 4. 사용

- 공개 제출 페이지: `/`
- 규리 전용 편지 보관함: `/letters`

`/letters`는 Supabase magic link 로그인 방식입니다. SQL에 입력한 이메일로 로그인해야 편지가 보입니다.

## 5. 마감

2026년 7월 6일 00:00 KST 이후에는 제출 폼이 닫힙니다.
