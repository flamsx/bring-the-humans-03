import { Composition } from "remotion";
import { BringTheHumans03 } from "./Composition";

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="BringTheHumans03"
				component={BringTheHumans03}
				durationInFrames={600}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{}}
			/>
		</>
	);
};
