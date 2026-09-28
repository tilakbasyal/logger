import { useState } from "react";
import type { AuthUser } from "../application/auth/auth-service";
import { authService } from "../application/auth/auth-service";

interface AccountMenuProps {
  user: AuthUser;
}

function AccountMenu({
  user,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  async function handleLogout() {
    await authService.signOut();
    setIsOpen(false);
  }

  return (
    <div className="account-menu">
      <button
        type="button"
        className="account-button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-expanded={isOpen}
        aria-label="Open account menu"
      >
        <span className="account-icon">
          👤
        </span>
      </button>

      {isOpen && (
        <div className="account-dropdown">
          <div className="account-user">
            <strong>Signed in as</strong>
            <span>{user.email ?? "Unknown user"}</span>
          </div>

          <button
            type="button"
            className="account-menu-item"
            onClick={() =>
              alert(
                "Profile will be available later.",
              )
            }
          >
            Profile
          </button>

          <button
            type="button"
            className="account-menu-item"
            onClick={() =>
              alert(
                "Change password will be available later.",
              )
            }
          >
            Change password
          </button>

          <button
            type="button"
            className="account-menu-item logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default AccountMenu;