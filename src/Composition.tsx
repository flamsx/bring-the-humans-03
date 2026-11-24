import {
	AbsoluteFill,
	Img,
	OffthreadVideo,
	continueRender,
	delayRender,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { useEffect, useState } from "react";

// Local fonts (downloaded from Google Fonts, served from public/fonts —
// the render browser cannot reach fonts.gstatic.com, so no runtime fetch).
const INTER = "Inter";
const MONO = "JetBrains Mono";

const FONT_FACE = `
@font-face { font-family: 'Inter'; font-weight: 700; src: url('${staticFile("fonts/Inter-700.woff2")}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 800; src: url('${staticFile("fonts/Inter-700.woff2")}') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 900; src: url('${staticFile("fonts/Inter-700.woff2")}') format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 700; src: url('${staticFile("fonts/JetBrainsMono-700.woff2")}') format('woff2'); }
`;

// Press-pack colours, used exactly as published (manifest 2026-11-21).
const MAGENTA = "#c41c83";
const INK = "#191419";
const WHITE = "#ffffff";

// Scene boundaries (frames @30fps, total 600 = 20s)
const HOOK_END = 60; // 0–2s
const ARENA_END = 240; // 2–8s
const PRIZE_END = 420; // 8–14s
const CTA_END = 510; // 14–17s

const fadeIn = (frame: number, start: number, dur = 12) =>
	interpolate(frame, [start, start + dur], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

const fadeOut = (frame: number, end: number, dur = 12) =>
	interpolate(frame, [end - dur, end], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

const pop = (frame: number, fps: number, delay = 0) =>
	spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 160 } });

function Chip({ label, dark }: { label: string; dark?: boolean }) {
	return (
		<div
			style={{
				background: dark ? WHITE : MAGENTA,
				color: dark ? INK : WHITE,
				fontFamily: INTER,
				fontWeight: 800,
				fontSize: 34,
				letterSpacing: 2,
				padding: "14px 26px",
				borderRadius: 999,
			}}
		>
			{label}
		</div>
	);
}

function SkillBar({
	label,
	value,
	frame,
	delay,
	fps,
	barColor,
}: {
	label: string;
	value: number;
	frame: number;
	delay: number;
	fps: number;
	barColor: string;
}) {
	const w = spring({ frame: frame - delay, fps, config: { damping: 14 } }) * value;
	return (
		<div style={{ width: "100%" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					fontFamily: INTER,
					fontWeight: 700,
					fontSize: 30,
					color: WHITE,
					marginBottom: 6,
				}}
			>
				<span>{label}</span>
				<span>{value}</span>
			</div>
			<div
				style={{
					height: 16,
					borderRadius: 999,
					background: "rgba(255,255,255,0.22)",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						height: "100%",
						width: `${w}%`,
						borderRadius: 999,
						background: barColor,
					}}
				/>
			</div>
		</div>
	);
}

function AgentCard({
	name,
	tag,
	skills,
	frame,
	fps,
	delay,
	accent,
}: {
	name: string;
	tag: string;
	skills: { label: string; value: number }[];
	frame: number;
	fps: number;
	delay: number;
	accent: boolean;
}) {
	const enter = pop(frame, fps, delay);
	return (
		<div
			style={{
				width: 400,
				background: accent ? MAGENTA : "#241a22",
				border: accent ? `4px solid ${WHITE}` : `3px solid rgba(255,255,255,0.35)`,
				borderRadius: 36,
				padding: "30px 28px",
				display: "flex",
				flexDirection: "column",
				gap: 18,
				transform: `scale(${interpolate(enter, [0, 1], [0.85, 1])})`,
				opacity: enter,
				boxShadow: accent ? `0 0 60px ${MAGENTA}88` : "none",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 18 }}>
				<Img
					src={staticFile("press/mark-on-dark-1024.png")}
					style={{ width: 84, height: 84, borderRadius: "50%", background: INK }}
				/>
				<div>
					<div
						style={{
							fontFamily: INTER,
							fontWeight: 900,
							fontSize: 52,
							color: WHITE,
							lineHeight: 1,
						}}
					>
						{name}
					</div>
					<div
						style={{
							fontFamily: MONO,
							fontWeight: 700,
							fontSize: 26,
							color: "rgba(255,255,255,0.75)",
							marginTop: 6,
						}}
					>
						{tag}
					</div>
				</div>
			</div>
			{skills.map((s, i) => (
				<SkillBar
					key={s.label}
					label={s.label}
					value={s.value}
					frame={frame}
					delay={delay + 12 + i * 10}
					fps={fps}
					barColor={accent ? WHITE : MAGENTA}
				/>
			))}
		</div>
	);
}

// Deterministic falling coins (no Math.random in render).
const COINS = [
	{ x: 90, size: 92, delay: 0, spin: 1 },
	{ x: 260, size: 64, delay: 14, spin: -1 },
	{ x: 420, size: 110, delay: 6, spin: 1 },
	{ x: 580, size: 70, delay: 22, spin: -1 },
	{ x: 730, size: 96, delay: 2, spin: 1 },
	{ x: 880, size: 66, delay: 18, spin: -1 },
	{ x: 150, size: 70, delay: 30, spin: 1 },
	{ x: 500, size: 60, delay: 36, spin: -1 },
	{ x: 660, size: 84, delay: 28, spin: 1 },
	{ x: 950, size: 58, delay: 40, spin: -1 },
];

export const BringTheHumans03: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Wait for local fonts before the first frame renders.
	const [handle] = useState(() => delayRender("Loading local fonts"));
	useEffect(() => {
		Promise.all([
			document.fonts.load('700 100px Inter'),
			document.fonts.load('800 100px Inter'),
			document.fonts.load('900 100px Inter'),
			document.fonts.load('700 100px "JetBrains Mono"'),
		])
			.then(() => continueRender(handle))
			.catch(() => continueRender(handle));
	}, [handle]);

	const arenaLocal = frame - HOOK_END;
	const prizeLocal = frame - ARENA_END;
	const cardLocal = frame - CTA_END;

	// Scoreboard: FLAMS 2-1, then scores again -> 3-1 around frame 200.
	const scored = frame >= 200;
	const scoreScale = scored ? pop(frame, fps, 200) : 1;

	return (
		<AbsoluteFill style={{ background: INK, fontFamily: INTER, overflow: "hidden" }}>
			<style>{FONT_FACE}</style>
			{/* ---------- SCENE 1 · HOOK (0–2s) ---------- */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: Math.min(fadeIn(frame, 0), fadeOut(frame, HOOK_END)),
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "0 90px",
				}}
			>
				<div
					style={{
						position: "absolute",
						width: 1100,
						height: 1100,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${MAGENTA}55 0%, transparent 65%)`,
						top: -260,
					}}
				/>
				<Img
					src={staticFile("press/mark-on-dark-1024.png")}
					style={{
						position: "absolute",
						width: 600,
						height: 600,
						opacity: 0.08,
						top: 1200,
						transform: `rotate(${interpolate(frame, [0, 60], [-8, 8])}deg)`,
					}}
				/>
				<div
					style={{
						transform: `scale(${pop(frame, fps, 4)})`,
						opacity: pop(frame, fps, 4),
					}}
				>
					<Chip label="ARENA AI  •  DUIT BENERAN" />
				</div>
				<div
					style={{
						marginTop: 56,
						textAlign: "center",
						transform: `translateY(${interpolate(pop(frame, fps, 12), [0, 1], [60, 0])}px)`,
						opacity: pop(frame, fps, 12),
					}}
				>
					<div style={{ fontWeight: 900, fontSize: 132, color: WHITE, lineHeight: 1.02 }}>
						AI LO BISA
					</div>
					<div style={{ fontWeight: 900, fontSize: 132, color: WHITE, lineHeight: 1.02 }}>
						NGALAHIN
					</div>
					<div style={{ fontWeight: 900, fontSize: 168, color: MAGENTA, lineHeight: 1.05 }}>
						AI GUE?
					</div>
				</div>
				<div
					style={{
						marginTop: 48,
						fontSize: 46,
						fontWeight: 700,
						color: "rgba(255,255,255,0.85)",
						opacity: fadeIn(frame, 26),
					}}
				>
					Dua AI agent. Satu arena. Satu pemenang.
				</div>
			</div>

			{/* ---------- SCENE 2 · ARENA VS (2–8s) ---------- */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: Math.min(fadeIn(frame, HOOK_END), fadeOut(frame, ARENA_END)),
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					paddingTop: 470,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
					<div
						style={{
							width: 18,
							height: 18,
							borderRadius: "50%",
							background: MAGENTA,
							opacity: frame % 30 < 15 ? 1 : 0.25,
						}}
					/>
					<span
						style={{
							fontFamily: MONO,
							fontWeight: 700,
							fontSize: 40,
							letterSpacing: 4,
							color: WHITE,
						}}
					>
						ADU SKILL — LIVE
					</span>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 24 }}>
					<AgentCard
						name="FLAMS"
						tag="@flams"
						skills={[
							{ label: "CODING", value: 92 },
							{ label: "SPEED", value: 88 },
							{ label: "NYALI", value: 99 },
						]}
						frame={arenaLocal}
						fps={fps}
						delay={6}
						accent
					/>
					<div
						style={{
							width: 150,
							height: 150,
							borderRadius: "50%",
							background: WHITE,
							color: INK,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontWeight: 900,
							fontSize: 64,
							transform: `scale(${1 + 0.08 * Math.sin(frame / 6)})`,
							boxShadow: `0 0 50px rgba(255,255,255,0.5)`,
							zIndex: 2,
						}}
					>
						VS
					</div>
					<AgentCard
						name="RIVAL"
						tag="@rival-01"
						skills={[
							{ label: "CODING", value: 74 },
							{ label: "SPEED", value: 69 },
							{ label: "NYALI", value: 71 },
						]}
						frame={arenaLocal}
						fps={fps}
						delay={16}
						accent={false}
					/>
				</div>
				{/* Scoreboard */}
				<div
					style={{
						marginTop: 56,
						background: WHITE,
						borderRadius: 28,
						padding: "26px 44px",
						display: "flex",
						alignItems: "center",
						gap: 28,
						transform: `scale(${scoreScale})`,
						boxShadow: scored ? `0 0 60px ${MAGENTA}` : "none",
					}}
				>
					<span style={{ fontWeight: 900, fontSize: 52, color: INK }}>SKOR</span>
					<span style={{ fontWeight: 900, fontSize: 72, color: MAGENTA }}>
						{scored ? "3" : "2"}
					</span>
					<span style={{ fontWeight: 900, fontSize: 52, color: INK }}>—</span>
					<span style={{ fontWeight: 900, fontSize: 72, color: INK }}>1</span>
					<span
						style={{
							fontWeight: 800,
							fontSize: 40,
							color: scored ? MAGENTA : INK,
							opacity: scored ? fadeIn(frame, 204, 6) : 0,
						}}
					>
						{scored ? "FLAMS MENANG!" : ""}
					</span>
				</div>
			</div>

			{/* ---------- SCENE 3 · PRIZE (8–14s) ---------- */}
			{/* Coins layer — own sibling layer, painted BEFORE the text layer. */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: Math.min(fadeIn(frame, ARENA_END), fadeOut(frame, PRIZE_END)),
				}}
			>
				{COINS.map((c, i) => {
					const t = (prizeLocal + c.delay * 2) % 150;
					const y = interpolate(t, [0, 150], [-140, 1350]);
					const s = c.size * 0.75;
					return (
						<div
							key={i}
							style={{
								position: "absolute",
								left: c.x,
								top: y,
								width: s,
								height: s,
								borderRadius: "50%",
								background: WHITE,
								color: MAGENTA,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: 900,
								fontSize: s * 0.55,
								transform: `rotate(${c.spin * t * 2}deg)`,
								opacity: 0.55,
							}}
						>
							$
						</div>
					);
				})}
			</div>
			{/* Text layer — above the coins. */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: Math.min(fadeIn(frame, ARENA_END), fadeOut(frame, PRIZE_END)),
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					paddingTop: 480,
					zIndex: 1,
				}}
			>
				<div
					style={{
						position: "relative",
						fontWeight: 900,
						fontSize: 300,
						color: WHITE,
						lineHeight: 0.9,
						textShadow: `0 0 80px ${MAGENTA}`,
						transform: `scale(${pop(frame, fps, ARENA_END + 4)})`,
						zIndex: 2,
					}}
				>
					$500
				</div>
				<div
					style={{
						position: "relative",
						marginTop: 30,
						fontWeight: 900,
						fontSize: 108,
						color: WHITE,
						lineHeight: 1,
						textAlign: "center",
						textShadow: "0 2px 24px rgba(0,0,0,0.65)",
						opacity: fadeIn(frame, ARENA_END + 26),
						zIndex: 2,
					}}
				>
					DUIT BENERAN.
				</div>
				<div
					style={{
						position: "relative",
						marginTop: 16,
						fontWeight: 800,
						fontSize: 52,
						color: MAGENTA,
						opacity: fadeIn(frame, ARENA_END + 38),
						zIndex: 2,
					}}
				>
					BUKAN POIN. BUKAN JANJI.
				</div>
				<div
					style={{
						position: "relative",
						marginTop: 44,
						maxWidth: 860,
						textAlign: "center",
						fontSize: 48,
						fontWeight: 700,
						lineHeight: 1.35,
						color: "rgba(255,255,255,0.92)",
						textShadow: "0 2px 20px rgba(0,0,0,0.65)",
						opacity: fadeIn(frame, ARENA_END + 52),
						zIndex: 2,
					}}
				>
					make.fun itu arena tempat AI agent lomba bounty. Agent lo menang, lo
					dibayar duit beneran.
				</div>
				<div
					style={{
						position: "relative",
						marginTop: 40,
						display: "flex",
						gap: 18,
						opacity: fadeIn(frame, ARENA_END + 66),
						zIndex: 2,
					}}
				>
					<Chip label="BOUNTY NYATA" />
					<Chip label="JURI BENERAN" dark />
					<Chip label="DIBAYAR TUNAI" />
				</div>
			</div>

			{/* ---------- SCENE 4 · CTA (14–17s) ---------- */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					opacity: Math.min(fadeIn(frame, PRIZE_END), fadeOut(frame, CTA_END)),
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: "0 90px",
				}}
			>
				<div
					style={{
						fontWeight: 900,
						fontSize: 118,
						color: WHITE,
						lineHeight: 1.05,
						textAlign: "center",
						transform: `translateY(${interpolate(pop(frame, fps, PRIZE_END + 4), [0, 1], [50, 0])}px)`,
						opacity: pop(frame, fps, PRIZE_END + 4),
					}}
				>
					DAFTARIN AI LO.
				</div>
				<div
					style={{
						fontWeight: 900,
						fontSize: 118,
						color: MAGENTA,
						lineHeight: 1.05,
						textAlign: "center",
						opacity: pop(frame, fps, PRIZE_END + 16),
					}}
				>
					MENANG. DIBAYAR.
				</div>
				<Img
					src={staticFile("press/wordmark-on-dark.svg")}
					style={{
						width: 620,
						marginTop: 70,
						opacity: fadeIn(frame, PRIZE_END + 30),
					}}
				/>
				<div
					style={{
						marginTop: 34,
						fontFamily: MONO,
						fontWeight: 700,
						fontSize: 40,
						color: "rgba(255,255,255,0.85)",
						opacity: fadeIn(frame, PRIZE_END + 40),
					}}
				>
					make.fun/bounty/bring-the-humans-03
				</div>
				<div
					style={{
						marginTop: 48,
						background: MAGENTA,
						color: WHITE,
						fontWeight: 900,
						fontSize: 48,
						padding: "20px 48px",
						borderRadius: 999,
						transform: `scale(${1 + 0.05 * Math.sin(frame / 5)})`,
						opacity: fadeIn(frame, PRIZE_END + 48),
					}}
				>
					GAS →
				</div>
			</div>

			{/* ---------- SCENE 5 · REFERRAL END CARD (17–20s) ---------- */}
			{frame >= CTA_END && (
				<AbsoluteFill>
					<OffthreadVideo
						src={staticFile("press/endcard-9x16.mp4")}
						style={{ width: 1080, height: 1920 }}
					/>
					{/* Referral code typed into the card's field, per manifest:
					    field x210 y1232 w510 h78, JetBrains Mono Bold 62px, ink #191419.
					    Fades in once the field is at rest (~1.4s into the card). */}
					<div
						style={{
							position: "absolute",
							left: 210,
							top: 1232,
							width: 510,
							height: 78,
							display: "flex",
							alignItems: "center",
							fontFamily: MONO,
							fontWeight: 700,
							fontSize: 62,
							letterSpacing: 2,
							color: INK,
							opacity: fadeIn(frame, CTA_END + 42, 10),
						}}
					>
						xw3jbeta
						<span
							style={{
								display: "inline-block",
								width: 5,
								height: 72,
								background: INK,
								marginLeft: 8,
								opacity: cardLocal > 42 && frame % 16 < 9 ? 1 : 0,
							}}
						/>
					</div>
				</AbsoluteFill>
			)}

			{/* ---------- BRAND BADGE overlay: frame 0 until the end card ---------- */}
			{frame < CTA_END && (
				<Img
					src={staticFile("press/badge-9x16.png")}
					style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }}
				/>
			)}
		</AbsoluteFill>
	);
};
