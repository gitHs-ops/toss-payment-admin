# 토스페이먼츠 결제 관리 어드민

Next.js 14 + TossPayments + NextAuth.js + Prisma 기반 결제 관리 시스템

## 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 열어 실제 값으로 수정
```

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `NEXTAUTH_SECRET` | 랜덤 시크릿 (openssl rand -base64 32) |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스페이먼츠 클라이언트 키 (공개) |
| `TOSS_SECRET_KEY` | 토스페이먼츠 시크릿 키 (서버 전용) |

### 3. DB 마이그레이션
```bash
npm run db:migrate
# 또는: npx prisma migrate dev --name init
```

### 4. Admin 계정 생성
```bash
# DB 직접 접근 또는 Prisma Studio 사용
npm run db:studio

# User 테이블에서 특정 사용자의 role을 ADMIN으로 변경
```

### 5. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

## 주요 경로

| 경로 | 설명 |
|------|------|
| `/payment` | 결제 요청 페이지 |
| `/payment/success` | 결제 성공 콜백 |
| `/payment/fail` | 결제 실패 페이지 |
| `/login` | 로그인 |
| `/admin/dashboard` | 대시보드 (Admin 전용) |
| `/admin/payments` | 결제 목록 (Admin 전용) |
| `/admin/payments/[id]` | 결제 상세 + 환불 (Admin 전용) |

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `PUT` | `/api/payments/confirm` | 주문 사전 등록 |
| `POST` | `/api/payments/confirm` | 결제 최종 승인 |
| `POST` | `/api/payments/[id]/cancel` | 결제 취소 (Admin) |
| `GET` | `/api/admin/payments` | 결제 목록 조회 (Admin) |
| `GET` | `/api/admin/payments/stats` | 대시보드 통계 (Admin) |

## 테스트 카드 정보 (토스페이먼츠 테스트 모드)

토스페이먼츠 테스트 환경에서는 실제 카드 정보 없이 아무 카드 번호나 입력해도 결제가 승인됩니다.

- 테스트 키: `test_ck_...` / `test_sk_...` 로 시작하는 키 사용
- [토스페이먼츠 테스트 가이드](https://developers.tosspayments.com/guides/payment-widget/integration)
