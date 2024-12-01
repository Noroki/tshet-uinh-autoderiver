import { Fragment, useState } from "react";

import { 資料 } from "tshet-uinh";

import { css } from "@emotion/react";
import styled from "@emotion/styled";

import Ruby from "./Ruby";
import Tooltip from "./Tooltip";
import CustomElement from "../Classes/CustomElement";
import { noop } from "../consts";

import type { Entry } from "../consts";

const Wrapper = styled.div`
  padding-top: 10px;
  margin-top: -10px;
  padding-bottom: 5px;
  margin-bottom: -5px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  white-space: break-spaces;
`;
const Item = styled.p<{ textColor: string }>`
  margin: 2px 10px;
  &:last-child {
    margin-bottom: 5px;
  }
  color: ${({ textColor }) => textColor};
  ${({ onClick }) =>
    onClick &&
    css`
      cursor: pointer;
      &:hover,
      &:focus {
        color: #0078e7;
      }
    `}
`;
const Missing = styled.span`
  &:after {
    content: "❬?❭";
    color: #bbb;
  }
`;
const Char = styled.span`
  font-size: 125%;
`;
const RubyWrapper = styled.span<{ textColor: string }>`
  display: inline-block;
  padding: 0 3px;
  color: ${({ textColor }) => textColor};
`;

type TooltipListener = (id: number, ch: string, 描述: string) => void;
let tooltipListener: TooltipListener = noop;
export function listenTooltip(listener: TooltipListener) {
  tooltipListener = listener;
}

export default function TooltipChar({
  id,
  ch,
  entries,
  preselected,
}: {
  id: number;
  ch: string;
  entries: Entry[];
  preselected: number;
}) {
  const [selected, setSelected] = useState(preselected);

  const resolved = selected !== -1;
  const currIndex = +resolved && selected;
  const { 擬音, 結果 } = entries[currIndex];
  const multiple = entries.length > 1;

  function onClick(charIndex: number, 描述: string) {
    return multiple
      ? () => {
          setSelected(charIndex);
          tooltipListener(id, ch, 描述);
        }
      : undefined;
  }

  return (
    <Tooltip
      element={
        <Wrapper>
          {entries.map(({ 擬音, 結果 }, index) => (
            <Item
              key={index}
              textColor={結果.some(({ 來源 }) => !來源) ? "#c00" : multiple && index === currIndex ? "#00f" : "black"}
              onClick={onClick(index, 結果[0].音韻地位.描述)}>
              <span key={CustomElement.stringify(擬音)} lang="och-Latn-fonipa">
                {CustomElement.render(擬音, <Missing />).map((item, index) => (
                  <Fragment key={index}>
                    {!!index && <span> / </span>}
                    {item}
                  </Fragment>
                ))}
              </span>
              {結果.map((條目, i) => {
                const { 字頭, 釋義 = "", 來源 = null, 音韻地位 } = 條目;
                const { 描述 } = 音韻地位;
                const 各反切 = {
                  反: new Set<string>(),
                  切: new Set<string>(),
                };
                if (條目.反切) {
                  各反切[來源?.文獻 === "王三" ? "反" : "切"].add(條目.反切);
                } else {
                  for (const { 反切, 來源 } of 資料.query音韻地位(音韻地位)) {
                    if (!反切) continue;
                    各反切[來源?.文獻 === "王三" ? "反" : "切"].add(反切);
                  }
                }
                各反切.反 = new Set(Array.from(各反切.反).filter(反切 => !各反切.切.has(反切)));
                const 反切text =
                  (["反", "切"] as const)
                    .flatMap(x => (各反切[x].size ? [[...各反切[x]].join("/") + x] : []))
                    .join(" ") + " ";
                const 出處text = 來源 && ["廣韻", "王三"].includes(來源.文獻) ? `［${來源.文獻} ${來源.韻目}韻］` : "";
                return (
                  <Fragment key={i}>
                    {i ? <br /> : " "}
                    <span onClick={onClick(index, 描述)}>
                      <Char>{字頭}</Char> {描述} {反切text + 釋義 + 出處text}
                    </span>
                  </Fragment>
                );
              })}
            </Item>
          ))}
        </Wrapper>
      }>
      <RubyWrapper
        textColor={結果.some(({ 來源 }) => !來源) ? "#c00" : multiple ? (resolved ? "#708" : "#00f") : "black"}>
        <Ruby rb={ch} rt={CustomElement.render(擬音)} />
      </RubyWrapper>
    </Tooltip>
  );
}
