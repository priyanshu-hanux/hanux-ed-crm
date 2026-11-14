import { useState, type FormEvent } from "react";
import {
    ArrowRight,
    Building2,
    CircleAlert,
    Eye,
    EyeOff,
    InfoIcon,
    LoaderCircle,
    LockKeyhole,
    Mail,
    UserRound,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { isApiError } from "@/types/app-error";
import type { AuthRedirectState } from "@/components/site/protected-route";

type FieldName = "orgName" | "name" | "email" | "password";
type Values = Record<FieldName, string>;

const EMPTY: Values = { orgName: "", name: "", email: "", password: "" };

/** Same rules as the server. */
function validate(values: Values, isSignup: boolean): Partial<Values> {
    const errors: Partial<Values> = {};
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address";
    if (!isSignup) {
        if (!values.password) errors.password = "Enter your password";
        return errors;
    }
    if (values.orgName.trim().length < 2) errors.orgName = "Enter your organization's name";
    if (!values.name.trim()) errors.name = "Enter your name";
    const p = values.password;
    if (p.length < 8 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
        errors.password = "At least 8 characters with uppercase, lowercase, and a number";
    }
    return errors;
}

type Mode = "signin" | "signup";

interface AuthFormProps {
    mode: Mode;
    isModal?: boolean;
    onClose?: () => void;
    onModeChange?: (mode: Mode) => void;
}

function Field({
    label,
    htmlFor,
    required,
    icon,
    right,
    optionbtn,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    icon?: React.ReactNode;
    right?: React.ReactNode;
    optionbtn?: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
                    {label}

                    {required && (
                        <span className="ml-1 text-primary">*</span>
                    )}
                </label>

                {optionbtn}
            </div>

            <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                    {icon}
                </div>

                {children}

                {right && (
                    <div className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2">
                        {right}
                    </div>
                )}
            </div>

            {error && (
                <p id={htmlFor ? `${htmlFor}-error` : undefined} className="mt-1.5 text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}

export const AuthForm = ({ mode = "signin" }: AuthFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [values, setValues] = useState<Values>(EMPTY);
    const [errors, setErrors] = useState<Partial<Values>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState(false);

    const { signIn, signUp } = useAuth();
    const location = useLocation();
    const reason = (location.state as AuthRedirectState | null)?.reason;
    // A success message, e.g. after resetting the password.
    const notice = (location.state as AuthRedirectState | null)?.notice;

    const isSignup = mode === "signup";

    const inputProps = (field: FieldName) => ({
        id: `auth-${field}`,
        name: field,
        value: values[field],
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            setValues((current) => ({ ...current, [field]: value }));
            if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
        },
        "aria-invalid": errors[field] ? true : undefined,
        "aria-describedby": errors[field] ? `auth-${field}-error` : undefined,
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        const clientErrors = validate(values, isSignup);
        setErrors(clientErrors);
        const missingTerms = isSignup && !acceptedTerms;
        setTermsError(missingTerms);
        if (Object.keys(clientErrors).length > 0 || missingTerms) return;

        setSubmitting(true);
        try {
            if (isSignup) {
                await signUp({
                    orgName: values.orgName.trim(),
                    name: values.name.trim(),
                    email: values.email.trim(),
                    password: values.password,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                });
            } else {
                await signIn(values.email.trim(), values.password);
            }
            // GuestRoute redirects once the session is loaded.
        } catch (error) {
            if (isApiError(error) && error.code === "VALIDATION_ERROR") {
                setErrors(error.fieldErrors as Partial<Values>);
            } else if (isApiError(error) && error.code === "EMAIL_IN_USE") {
                setErrors({ email: error.message });
            } else {
                setFormError(isApiError(error) ? error.message : "Something went wrong. Please try again.");
            }
            setSubmitting(false);
        }
    };

    return (
        <section className="relative w-full max-w-md">
            <div className="card-premium relative overflow-hidden bg-card/95 p-6 sm:px-8 sm:py-6">
                {/* Header */}
                <div className="mb-7">
                    <h1 className="font-serif text-2xl tracking-[-0.02em]">
                        {isSignup
                            ? "Create an account"
                            : "Welcome back"}
                    </h1>

                    <p className="mt-1.5 text-sm text-muted-foreground">
                        {isSignup
                            ? "Enter your information to get started."
                            : "Sign in to continue."
                        }
                    </p>
                </div>

                {/* Social buttons */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        className="
                            cursor-pointer flex h-11 items-center justify-center gap-2
                            rounded-xl border border-border
                            bg-background
                            text-sm font-medium
                            transition
                            hover:border-primary/50
                            hover:bg-secondary
                        "
                    >
                        <GoogleIcon />
                        Google
                    </button>

                    <button
                        type="button"
                        className="
                            cursor-pointer flex h-11 items-center justify-center gap-2
                            rounded-xl border border-border
                            bg-background
                            text-sm font-medium
                            transition
                            hover:border-primary/50
                            hover:bg-secondary
                        "
                    >
                        <InstagramIcon />
                        Instagram
                    </button>
                </div>

                {/* Divider */}
                <div className="my-7 flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />

                    <span className="text-xs text-muted-foreground">
                        Or continue with email
                    </span>

                    <div className="h-px flex-1 bg-border" />
                </div>

                {/* Form */}
                {/* Why they were signed out, or why the request failed */}
                {!formError && !isSignup && notice && (
                    <div
                        role="status"
                        className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3 text-sm text-foreground"
                    >
                        {notice}
                    </div>
                )}

                {(formError ?? (!isSignup && reason)) && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
                    >
                        <CircleAlert size={16} className="mt-0.5 shrink-0" />
                        <span>{formError ?? reason}</span>
                    </div>
                )}

                <form
                    className="space-y-5"
                    noValidate
                    onSubmit={handleSubmit}
                >
                    {/* Organization */}
                    {isSignup && (
                        <Field
                            label="Organization name"
                            htmlFor="auth-orgName"
                            required
                            icon={<Building2 size={16} />}
                            error={errors.orgName}
                        >
                            <input
                                type="text"
                                placeholder="Acme Academy"
                                autoComplete="organization"
                                className="auth-input caret-primary"
                                {...inputProps("orgName")}
                            />
                        </Field>
                    )}

                    {/* Full name */}
                    {isSignup && (
                        <Field
                            label="Full name"
                            htmlFor="auth-name"
                            required
                            icon={<UserRound size={16} />}
                            error={errors.name}
                        >
                            <input
                                type="text"
                                placeholder="John Doe"
                                autoComplete="name"
                                className="auth-input caret-primary"
                                {...inputProps("name")}
                            />
                        </Field>
                    )}

                    {/* Email */}
                    <Field
                        label="Email address"
                        htmlFor="auth-email"
                        required
                        icon={<Mail size={16} />}
                        error={errors.email}
                    >
                        <input
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="auth-input"
                            {...inputProps("email")}
                        />
                    </Field>

                    {/* Password */}
                    <Field
                        label="Password"
                        htmlFor="auth-password"
                        required
                        error={errors.password}
                        icon={<LockKeyhole size={16} />}
                        optionbtn={
                            isSignup ? (
                                <div className="group relative">
                                    <button
                                        type="button"
                                        aria-label="Password requirements"
                                        className="
                                            mr-2 flex cursor-pointer
                                            items-center justify-center
                                            text-muted-foreground
                                            transition
                                            hover:text-gold-deep
                                        "
                                    >
                                        <InfoIcon size={15} />
                                    </button>

                                    <div
                                        className="
                                            pointer-events-none
                                            absolute bottom-full right-0
                                            z-50 mb-2
                                            w-64 translate-y-1
                                            rounded-lg border border-border
                                            bg-card px-3 py-2.5
                                            text-xs leading-5
                                            text-muted-foreground
                                            opacity-0 shadow-xl
                                            transition-all duration-200
                                            group-hover:translate-y-0
                                            group-hover:opacity-100
                                        "
                                    >
                                        Password must be at least 8
                                        characters with uppercase,
                                        lowercase, and number.

                                        <div
                                            className="
                                                absolute
                                                bottom-[-4.5px] right-2.5
                                                h-2 w-2 rotate-45
                                                border-b border-r
                                                border-border
                                                bg-card
                                            "
                                        />
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to="/auth/forgot-password"
                                    state={{ email: values.email.trim() }}
                                    className="
                                        cursor-pointer
                                        text-sm font-medium
                                        text-gold-deep
                                        transition
                                        hover:text-primary
                                        hover:underline
                                    "
                                >
                                    Forgot password?
                                </Link>
                            )
                        }
                        right={
                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword((current) => !current)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                className="
                                    flex cursor-pointer
                                    text-muted-foreground
                                    transition
                                    hover:text-foreground
                                "
                            >
                                {showPassword ? (
                                    <EyeOff size={17} />
                                ) : (
                                    <Eye size={17} />
                                )}
                            </button>
                        }
                    >
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={
                                isSignup
                                    ? "Create a password"
                                    : "Enter your password"
                            }
                            autoComplete={
                                isSignup
                                    ? "new-password"
                                    : "current-password"
                            }
                            className="auth-input pr-12"
                            {...inputProps("password")}
                        />
                    </Field>

                    {/* Terms */}
                    {isSignup && (
                        <label
                            className="
                                flex cursor-pointer
                                items-start gap-3
                                text-sm leading-5
                                text-muted-foreground
                            "
                        >
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(event) => {
                                    setAcceptedTerms(event.target.checked);
                                    if (event.target.checked) setTermsError(false);
                                }}
                                aria-invalid={termsError || undefined}
                                aria-describedby={termsError ? "auth-terms-error" : undefined}
                                className="
                                    mt-0.5 h-4 w-4 shrink-0
                                    rounded border-border
                                    accent-primary
                                "
                            />

                            <span>
                                I agree to{" "}
                                <Link
                                    to="/terms"
                                    className="
                                        font-medium text-foreground
                                        underline underline-offset-4
                                        hover:text-primary
                                    "
                                >
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link
                                    to="/privacy"
                                    className="
                                        font-medium text-foreground
                                        underline underline-offset-4
                                        hover:text-primary
                                    "
                                >
                                    Privacy Policy
                                </Link>

                                <span className="ml-1 text-destructive">
                                    *
                                </span>
                            </span>
                        </label>
                    )}
                    {isSignup && termsError && (
                        <p id="auth-terms-error" className="-mt-3 text-xs text-destructive">
                            Please accept the Terms of Service and Privacy Policy
                        </p>
                    )}

                    {/* CTA */}
                    <button
                        type="submit"
                        disabled={submitting}
                        aria-busy={submitting}
                        className="
                            disabled:pointer-events-none disabled:opacity-70
                            btn-shine group relative
                            flex h-12 w-full
                            cursor-pointer items-center justify-center gap-2
                            rounded-xl
                            bg-primary
                            text-sm font-semibold
                            text-primary-foreground
                            shadow-[0_10px_30px_-12px_rgba(169,120,47,0.7)]
                            transition
                            hover:-translate-y-0.5
                            hover:shadow-[0_14px_34px_-12px_rgba(169,120,47,0.8)]
                        "
                    >
                        {submitting
                            ? isSignup ? "Creating account…" : "Signing in…"
                            : isSignup ? "Create account" : "Sign in"}

                        {submitting ? (
                            <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                            <ArrowRight
                                size={16}
                                className="
                                    transition-transform
                                    group-hover:translate-x-1
                                "
                            />
                        )}
                    </button>
                </form>

                {/* Switch mode */}
                <div
                    className="
                        mt-7
                        border-t border-border
                        pt-6
                        text-center
                        text-sm
                        text-muted-foreground
                    "
                >
                    {isSignup ? (
                        <>
                            Already have an account?{" "}
                            <Link
                                to="/auth/sign-in"
                                className="
                                        font-medium text-gold-deep
                                        underline underline-offset-4
                                        hover:text-primary
                                    "
                            >
                                Sign in
                            </Link>
                        </>
                    ) : (
                        <>
                            Don&apos;t have an account?{" "}
                            <Link
                                to="/auth/sign-up"
                                className="
                                        font-medium text-gold-deep
                                        underline underline-offset-4
                                        hover:text-primary
                                    "
                            >
                                Sign up, it&apos;s free
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

function GoogleIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.14 3.57-8.64Z"
            />

            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.76-2.11-6.71-4.95H1.29v3.09A12 12 0 0 0 12 24Z"
            />

            <path
                fill="#FBBC05"
                d="M5.29 14.29A7.22 7.22 0 0 1 4.91 12c0-.8.14-1.57.38-2.29V6.62H1.29A12 12 0 0 0 0 12c0 1.94.46 3.78 1.29 5.38l4-3.09Z"
            />

            <path
                fill="#EA4335"
                d="M12 4.76c1.77 0 3.36.61 4.61 1.81l3.46-3.46C17.94 1.15 15.23 0 12 0A12 12 0 0 0 1.29 6.62l4 3.09C6.24 6.87 8.88 4.76 12 4.76Z"
            />
        </svg>
    );
}

function InstagramIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient
                    id="instagram-gradient"
                    x1="2"
                    y1="22"
                    x2="22"
                    y2="2"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#FFDC80" />
                    <stop offset="0.25" stopColor="#FCAF45" />
                    <stop offset="0.5" stopColor="#F77737" />
                    <stop offset="0.75" stopColor="#E1306C" />
                    <stop offset="1" stopColor="#833AB4" />
                </linearGradient>
            </defs>

            <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="5"
                stroke="url(#instagram-gradient)"
                strokeWidth="2"
            />

            <circle
                cx="12"
                cy="12"
                r="4"
                stroke="url(#instagram-gradient)"
                strokeWidth="2"
            />

            <circle
                cx="17.5"
                cy="6.5"
                r="1"
                fill="#E1306C"
            />
        </svg>
    );
}