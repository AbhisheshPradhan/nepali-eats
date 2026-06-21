const { Button, Tag, PlaceCard, Badge, Input } = window.DesignSystem_580998;

function Bunting() {
	const flags = [
		"var(--flag-blue)",
		"var(--flag-yellow)",
		"var(--flag-red)",
		"var(--flag-green)",
	];
	return (
		<div
			style={{
				display: "flex",
				gap: "8px",
				justifyContent: "center",
				marginBottom: "18px",
			}}
		>
			{Array.from({ length: 9 }).map((_, i) => (
				<span
					key={i}
					style={{
						width: 0,
						height: 0,
						borderLeft: "14px solid transparent",
						borderRight: "14px solid transparent",
						borderTop: `24px solid ${flags[i % 4]}`,
						filter: "drop-shadow(0 3px 3px rgba(43,26,18,.18))",
					}}
				/>
			))}
		</div>
	);
}

function Home({ onNav, onSearch, onNearMe, onOpen }) {
	const data = window.NE_DATA;
	const featured = data.venues.slice(0, 6);
	const [heroQ, setHeroQ] = React.useState("");
	const submit = () => onSearch(heroQ);
	const trackRef = React.useRef(null);
	const scrollBy = (dir) => {
		if (trackRef.current)
			trackRef.current.scrollBy({ left: dir * 360, behavior: "smooth" });
	};

	return (
		<div>
			{/* HERO */}
			<section
				style={{
					position: "relative",
					overflow: "hidden",
					background:
						"radial-gradient(1200px 500px at 50% -10%, var(--marigold-100), var(--paper-50))",
				}}
			>
				<div
					style={{
						maxWidth: "var(--container-narrow)",
						margin: "0 auto",
						padding: "56px 24px 40px",
						textAlign: "center",
					}}
				>
					<Bunting />
					<span
						style={{
							fontFamily: "var(--font-body)",
							fontWeight: 700,
							fontSize: ".82rem",
							letterSpacing: ".14em",
							textTransform: "uppercase",
							color: "var(--chili-500)",
						}}
					>
						All across Australia
					</span>
					<h1
						style={{
							fontFamily: "var(--font-display)",
							fontWeight: 800,
							fontSize: "clamp(2.6rem, 6vw, 4.25rem)",
							lineHeight: 1.02,
							letterSpacing: "-.02em",
							color: "var(--ink-900)",
							margin: "12px 0 0",
						}}
					>
						Find your
						<br />
						<span style={{ color: "var(--chili-500)" }}>
							momo people.
						</span>
					</h1>
					<p
						style={{
							fontSize: "1.25rem",
							color: "var(--ink-700)",
							maxWidth: 560,
							margin: "18px auto 0",
							lineHeight: 1.5,
						}}
					>
						From hole-in-the-wall steamers to Sunday market stalls,
						every hidden gem serving real Nepali food, gathered in
						one happy place.
					</p>
					{/* hero search — input + button in one pill; empty search defaults to Sydney */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
						style={{ maxWidth: 600, margin: "30px auto 0" }}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
								background: "#fff",
								border: "2px solid var(--border-strong)",
								borderRadius: "var(--radius-pill)",
								padding: "6px 6px 6px 20px",
								boxShadow: "var(--shadow-md)",
							}}
						>
							<i
								className="ph ph-magnifying-glass"
								style={{
									color: "var(--text-muted)",
									fontSize: "1.35rem",
									flex: "none",
								}}
							/>
							<input
								value={heroQ}
								onChange={(e) => setHeroQ(e.target.value)}
								placeholder="Search a restaurant, suburb or postcode"
								style={{
									flex: 1,
									border: "none",
									outline: "none",
									background: "transparent",
									fontFamily: "var(--font-body)",
									fontSize: "1.1rem",
									color: "var(--ink-900)",
									minWidth: 0,
								}}
							/>
							<Button
								size="md"
								variant="primary"
								type="submit"
								iconRight={<i className="ph ph-arrow-right" />}
							>
								Search
							</Button>
						</div>
					</form>
					{/* location-share prompt — styled as a clear, tappable pill */}
					<button
						onClick={onNearMe}
						onMouseEnter={(e) => {
							e.currentTarget.style.background =
								"var(--chili-100)";
							e.currentTarget.style.borderColor =
								"var(--chili-500)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "#fff";
							e.currentTarget.style.borderColor =
								"var(--border-strong)";
						}}
						style={{
							background: "#fff",
							border: "2px solid var(--border-strong)",
							borderRadius: "var(--radius-pill)",
							cursor: "pointer",
							marginTop: "16px",
							padding: "9px 18px",
							color: "var(--chili-600)",
							fontFamily: "var(--font-display)",
							fontWeight: 700,
							fontSize: "1rem",
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
							boxShadow: "var(--shadow-sm)",
							transition:
								"background var(--dur-fast), border-color var(--dur-fast)",
						}}
					>
						<i
							className="ph-fill ph-navigation-arrow"
							style={{ color: "var(--chili-500)" }}
						/>
						<span>
							Share your location and we’ll find the closest momo
						</span>
					</button>
				</div>
			</section>

			{/* FEATURED */}
			<section
				style={{
					maxWidth: "var(--container)",
					margin: "0 auto",
					padding: "44px 24px 0",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						justifyContent: "space-between",
						marginBottom: "20px",
						flexWrap: "wrap",
						gap: "8px",
					}}
				>
					<div>
						<span
							style={{
								fontFamily: "var(--font-body)",
								fontWeight: 700,
								fontSize: ".82rem",
								letterSpacing: ".14em",
								textTransform: "uppercase",
								color: "var(--marigold-700)",
							}}
						>
							Local favourites
						</span>
						<h2
							style={{
								fontFamily: "var(--font-display)",
								fontWeight: 800,
								fontSize: "2.2rem",
								margin: "4px 0 0",
								color: "var(--ink-900)",
							}}
						>
							This week's hidden gems
						</h2>
					</div>
					<Button
						variant="ghost"
						iconRight={<i className="ph ph-arrow-right" />}
						onClick={() => onNav("explore")}
					>
						See all spots
					</Button>
				</div>
				<div
					style={{
						display: "grid",
						gridTemplateColumns:
							"repeat(auto-fill, minmax(300px, 1fr))",
						gap: "24px",
					}}
				>
					{featured.map((v) => (
						<PlaceCard
							key={v.id}
							{...v}
							onClick={() => onOpen(v.id)}
						/>
					))}
				</div>
			</section>

			{/* DISH CAROUSEL — image placeholders; swap in real dish photos later */}
			<section
				style={{
					maxWidth: "var(--container)",
					margin: "40px auto 0",
					padding: "0 24px",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						justifyContent: "space-between",
						marginBottom: "18px",
						gap: "8px",
					}}
				>
					<div>
						<span
							style={{
								fontFamily: "var(--font-body)",
								fontWeight: 700,
								fontSize: ".82rem",
								letterSpacing: ".14em",
								textTransform: "uppercase",
								color: "var(--himalaya-700)",
							}}
						>
							Eat by craving
						</span>
						<h2
							style={{
								fontFamily: "var(--font-display)",
								fontWeight: 800,
								fontSize: "2.2rem",
								margin: "4px 0 0",
								color: "var(--ink-900)",
							}}
						>
							What are you sshungry for?
						</h2>
					</div>
					<div style={{ display: "flex", gap: 10, flex: "none" }}>
						{[
							["ph-caret-left", -1],
							["ph-caret-right", 1],
						].map(([icon, dir]) => (
							<button
								key={icon}
								onClick={() => scrollBy(dir)}
								aria-label={dir < 0 ? "Previous" : "Next"}
								onMouseEnter={(e) => {
									e.currentTarget.style.background =
										"var(--ink-900)";
									e.currentTarget.style.color = "#fff";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background =
										"var(--surface-card)";
									e.currentTarget.style.color =
										"var(--ink-900)";
								}}
								style={{
									width: 44,
									height: 44,
									borderRadius: "var(--radius-pill)",
									border: "2px solid var(--ink-900)",
									background: "var(--surface-card)",
									color: "var(--ink-900)",
									cursor: "pointer",
									fontSize: "1.2rem",
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									transition:
										"background var(--dur-fast), color var(--dur-fast)",
								}}
							>
								<i className={`ph ${icon}`} />
							</button>
						))}
					</div>
				</div>
				<div
					ref={trackRef}
					className="ne-hscroll"
					style={{
						display: "flex",
						gap: 18,
						overflowX: "auto",
						scrollSnapType: "x mandatory",
						padding: "4px 8px 10px",
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}
				>
					{data.cuisines.map((c, i) => {
						const h = [18, 35, 350, 168, 4, 45, 205, 120, 28][
							i % 9
						];
						return (
							<button
								key={c}
								onClick={() => onSearch(c)}
								style={{
									flex: "none",
									width: 230,
									scrollSnapAlign: "start",
									background: "none",
									border: "none",
									padding: 0,
									cursor: "pointer",
									textAlign: "left",
								}}
							>
								<div
									style={{
										height: 170,
										borderRadius: "var(--radius-lg)",
										background: `linear-gradient(135deg, hsl(${h},78%,62%), hsl(${(h + 32) % 360},76%,50%))`,
										display: "grid",
										placeItems: "center",
										color: "rgba(255,255,255,.85)",
										fontSize: "2rem",
										boxShadow: "var(--shadow-sm)",
									}}
								>
									<i className="ph ph-image" />
								</div>
								<div
									style={{
										marginTop: 10,
										fontFamily: "var(--font-display)",
										fontWeight: 600,
										fontSize: "1.1rem",
										color: "var(--ink-900)",
									}}
								>
									{c}
								</div>
							</button>
						);
					})}
				</div>
			</section>

			{/* STORY STRIP */}
			<section
				style={{
					maxWidth: "var(--container)",
					margin: "0 auto",
					padding: "56px 24px 0",
				}}
			>
				<div
					style={{
						background: "var(--ink-900)",
						borderRadius: "var(--radius-xl)",
						padding: "44px",
						display: "flex",
						gap: "32px",
						alignItems: "center",
						flexWrap: "wrap",
						position: "relative",
						overflow: "hidden",
					}}
				>
					<div style={{ flex: "1 1 320px" }}>
						<Badge
							tone="favourite"
							solid
						>
							Our story
						</Badge>
						<h3
							style={{
								fontFamily: "var(--font-display)",
								fontWeight: 800,
								fontSize: "2rem",
								color: "#fff",
								margin: "14px 0 10px",
							}}
						>
							Nepali food is having a moment. We didn't want to
							miss a single plate.
						</h3>
						<p
							style={{
								color: "var(--paper-200)",
								fontSize: "1.1rem",
								lineHeight: 1.6,
								margin: "0 0 20px",
							}}
						>
							NepaliEats started as a group chat of friends
							swapping momo tips. Now it's a map of every kitchen,
							cafe and truck worth the trip, added by people who
							actually eat there.
						</p>
						<Button
							variant="secondary"
							iconRight={<i className="ph ph-arrow-right" />}
							onClick={() => onNav("stories")}
						>
							Read the story
						</Button>
					</div>
					<div
						style={{
							flex: "0 0 200px",
							display: "grid",
							placeItems: "center",
						}}
					>
						<img
							src="../../assets/logo-momo.svg"
							alt=""
							style={{ width: 160, opacity: 0.96 }}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
window.Home = Home;
