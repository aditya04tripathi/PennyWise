import { useState, type ReactNode } from 'react';
import {
	Pressable,
	type PressableProps,
	type StyleProp,
	type ViewStyle,
} from 'react-native';
import Animated, {
	cubicBezier,
	useReducedMotion,
} from 'react-native-reanimated';

export function PressableScale({
	children,
	disabled,
	style,
	contentStyle,
	onPressIn,
	onPressOut,
	...rest
}: PressableProps & {
	children: ReactNode;
	contentStyle?: StyleProp<ViewStyle>;
}) {
	const [pressed, setPressed] = useState(false);
	const reducedMotion = useReducedMotion();
	const showPressed = pressed && !disabled && !reducedMotion;

	return (
		<Pressable
			disabled={disabled}
			pressRetentionOffset={16}
			onPressIn={(event) => {
				setPressed(true);
				onPressIn?.(event);
			}}
			onPressOut={(event) => {
				setPressed(false);
				onPressOut?.(event);
			}}
			style={style}
			{...rest}>
			<Animated.View
				style={[
					{
						transform: [{ scale: showPressed ? 0.97 : 1 }],
						transitionProperty: 'transform',
						transitionDuration: '120ms',
						transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
					},
					contentStyle,
				]}>
				{children}
			</Animated.View>
		</Pressable>
	);
}
