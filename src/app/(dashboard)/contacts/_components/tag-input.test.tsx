import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TagInput } from "./tag-input";

const mockAllTags = [
  { id: "t1", name: "react" },
  { id: "t2", name: "sales" },
];

describe("TagInput", () => {
  it("renders existing tags as badges with remove button", () => {
    render(
      <TagInput
        value={["react", "sales"]}
        allTags={mockAllTags}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("sales")).toBeInTheDocument();
    const removeButtons = screen.getAllByRole("button", { name: /rimuovi/i });
    expect(removeButtons).toHaveLength(2);
  });

  it("calls onRemove when X on a tag badge is clicked", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <TagInput
        value={["react", "sales"]}
        allTags={mockAllTags}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );

    const removeButtons = screen.getAllByRole("button", { name: /rimuovi react/i });
    await user.click(removeButtons[0] as HTMLElement);

    expect(onRemove).toHaveBeenCalledWith("react");
  });

  it("shows input placeholder when no tags", () => {
    render(<TagInput value={[]} allTags={mockAllTags} onAdd={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByPlaceholderText("Aggiungi tag...")).toBeInTheDocument();
  });

  it("opens dropdown on input focus with existing tags", async () => {
    const user = userEvent.setup();
    render(<TagInput value={[]} allTags={mockAllTags} onAdd={vi.fn()} onRemove={vi.fn()} />);

    await user.click(screen.getByPlaceholderText("Aggiungi tag..."));

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("sales")).toBeInTheDocument();
  });

  it("calls onAdd when an existing tag is selected", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <TagInput
        value={[]}
        allTags={[{ id: "t1", name: "react" }]}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByPlaceholderText("Aggiungi tag..."));
    await user.click(screen.getByText("react"));

    expect(onAdd).toHaveBeenCalledWith("react");
  });

  it("calls onAdd with new tag name when user types and presses Enter", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<TagInput value={[]} allTags={[]} onAdd={onAdd} onRemove={vi.fn()} />);

    const input = screen.getByPlaceholderText("Aggiungi tag...");
    await user.click(input);
    await user.type(input, "newtag");
    await user.keyboard("{Enter}");

    expect(onAdd).toHaveBeenCalledWith("newtag");
  });

  it("does not add duplicate tag (already in value)", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <TagInput
        value={["react"]}
        allTags={[{ id: "t1", name: "react" }]}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText("Aggiungi tag...");
    await user.click(input);
    await user.type(input, "react");
    await user.keyboard("{Enter}");

    expect(onAdd).not.toHaveBeenCalled();
  });
});
