import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { getNewMetaDataConfig } from '@/utils/UtilityService';

interface RoleSelectionModalProps {
  open: boolean;
  onRoleSelected: (role: { id: string; label: string }) => void;
}

const DEFAULT_ROLES = [{ id: 'retailer', label: 'Retailer' }];

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ open, onRoleSelected }) => {
  const dispatch = useDispatch();
  const [roles, setRoles] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedRole, setSelectedRole] = useState<{ id: string; label: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const clientConfig = await getNewMetaDataConfig();
        const rolesFromConfig = clientConfig?.find((config: any) => config.domainType === "portal_configuration")?.domainValues ?? [];
        if (!rolesFromConfig) {
          setRoles(DEFAULT_ROLES);
          setSelectedRole(DEFAULT_ROLES[0]);
          setLoading(false);
          return;
        }
        const rolesPresentConfig = rolesFromConfig?.find((option: { name: string }) => {
          return option.name === "rolesPresent";
        });
        if (rolesPresentConfig?.value && Array.isArray(rolesPresentConfig.value) && rolesPresentConfig.value.length > 0) {
          const rolesData = rolesPresentConfig.value.map((role: { id: string; label: string }) => ({
            id: role.id,
            label: role.label
          }));
          setRoles(rolesData);
          setSelectedRole(rolesData[0]);
        } else {
          setRoles(DEFAULT_ROLES);
          setSelectedRole(DEFAULT_ROLES[0]);
        }
      } catch (error) {
        console.error('Error fetching roles config:', error);
        setRoles(DEFAULT_ROLES);
        setSelectedRole(DEFAULT_ROLES[0]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchRoles();
    }
  }, [open]);

  const handleConfirm = () => {
    if (selectedRole) {
      // Dispatch to Redux
      dispatch({
        type: 'setCurrentRole',
        payload: selectedRole
      });
      
      // Notify parent
      onRoleSelected(selectedRole);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      onClose={(event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          return;
        }
      }}
    >
      <DialogTitle>
        <div className="font-bold text-xl">Select Role</div>
        <div className="text-sm text-gray-500 mt-1">Choose a role to manage content</div>
      </DialogTitle>
      
      <DialogContent>
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <CircularProgress size={40} />
            </div>
          ) : (
            <Autocomplete
              options={roles}
              value={selectedRole}
              onChange={(event, newValue) => setSelectedRole(newValue)}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Role"
                  placeholder="Choose role"
                  size="medium"
                  fullWidth
                />
              )}
              fullWidth
            />
          )}
        </div>
      </DialogContent>
      
      <DialogActions className="p-4">
        <Button
          onClick={handleConfirm}
          disabled={!selectedRole || loading}
          variant="contained"
          color="primary"
          fullWidth
          size="large"
        >
          {loading ? 'Loading...' : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

