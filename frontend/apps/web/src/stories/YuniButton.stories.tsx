import type { Meta, StoryObj } from "@storybook/react";

import { YuniButton } from "@yuni/ui";

const meta: Meta<typeof YuniButton> = {
  title: "Yuni/YuniButton",
  component: YuniButton,
  args: { children: "Action" },
};

export default meta;

type Story = StoryObj<typeof YuniButton>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Danger: Story = { args: { variant: "danger" } };
export const Loading: Story = { args: { loading: true } };
