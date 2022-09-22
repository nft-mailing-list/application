export const getContentByLabel = (label: string, content: any) => {
    return content.filter(
        (con: { label: string; value: string }) => con.label === label
    )[0].value;
};