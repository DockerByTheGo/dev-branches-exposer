"use client";
import { UseState } from "@blazyts/frontend-thingies";
import { DeploymentInstance } from "../../../../core/src/scehams-and-types/main";
import { Card, CardContent } from "admin-panel/components/ui/card";
import { Button } from "admin-panel/components/ui/button";
import type React from "react";
import type { State } from "@blazyts/frontend-thingies/src/react/hooks/useStateAsObject";
import { Deployments, Services } from "admin-panel/lib/services/main";
import { ifNotNone } from "@blazyts/better-standard-library";
import { useEffect } from "react";

// Popup utility
export function UsePopup(v: { component: () => React.ReactNode }): {
  toggleState: State<boolean>;
  component: React.ReactNode;
} {
  const toggle = UseState(false);

  return {
    component: <div>{toggle.value ? v.component() : null}</div>,
    toggleState: toggle,
  };
}

// Editable Deployment Component
export const editableDeployment = (
  oldDomain: string,
  onClose: () => void,
  onUpdate: (newDomain: string) => void,
) => {
  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const domain = formData.get("domain");
          ifNotNone(domain, async (v) => {
            await Services.admin["change-domain"]({
              domain: oldDomain,
              newDomain: v,
            });
          });
        }}
      >
        <input type="text" defaultValue={oldDomain} />
        <Button type="submit">Save</Button>
      </form>
    </div>
  );
};

export const ConfirmButton: React.FC<{ onClick: () => void; text: string }> = ({
  onClick,
  text,
}) => {
  const confirnation = UseState(false);

  return (
    <div>
      {confirnation.value === false ? (
        <button onClick={() => confirnation.set(true)}>{text}</button>
      ) : (
        <button onClick={onClick}>confirm ?</button>
      )}
    </div>
  );
};

export default function Project() {
  const deployments = UseState<DeploymentInstance[]>(
    []
  );
  const selectedDomain = UseState<string>("");

  useEffect(() => {
    Services.admin.getDeployments().then(v => ifNotNone(v,v => deployments.set(v.data)))
  })


  
  const updateDeploymentDomain = (oldDomain: string, newDomain: string) => {
    deployments.set(
      deployments.value.map((d) =>
        d.domain === oldDomain ? { ...d, domain: newDomain } : d,
      ),
    );
  };

  const popup = UsePopup({
    component: () =>
      editableDeployment(
        selectedDomain.value,
        () => popup.toggleState.set(false),
        (newDomain) => updateDeploymentDomain(selectedDomain.value, newDomain),
      ),
  });

  return (
    <div>
      {popup.component}
      {deployments.value.map((deployment, idx) => (
        <Card key={idx}>
          <CardContent>{deployment.domain}</CardContent>
          <CardContent>{deployment.port}</CardContent>
          <Button
            onClick={() => {
              selectedDomain.set(deployment.domain);
              popup.toggleState.set(true);
            }}
          >
            Inspect
          </Button>
          <ConfirmButton
            onClick={() => Deployments.remove(deployment)}
            text="delete"
          ></ConfirmButton>
        </Card>
      ))}
    </div>
  );
}
