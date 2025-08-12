
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Student } from '@/types/Student';
import { Edit3 } from 'lucide-react';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Student>) => void;
  selectedCount: number;
}

const BulkEditDialog = ({ isOpen, onClose, onUpdate, selectedCount }: BulkEditDialogProps) => {
  const [updates, setUpdates] = useState<{
    department?: string;
    level?: 'elementary' | 'junior-high' | 'senior-high' | 'college';
    updateDepartment: boolean;
    updateLevel: boolean;
  }>({
    updateDepartment: false,
    updateLevel: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalUpdates: Partial<Student> = {};
    
    if (updates.updateDepartment && updates.department) {
      finalUpdates.department = updates.department;
    }

    if (updates.updateLevel && updates.level) {
      finalUpdates.level = updates.level;
    }

    if (Object.keys(finalUpdates).length > 0) {
      onUpdate(finalUpdates);
    }
    
    handleClose();
  };

  const handleClose = () => {
    setUpdates({
      updateDepartment: false,
      updateLevel: false,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Bulk Edit Students
          </DialogTitle>
          <DialogDescription>
            Update information for {selectedCount} selected student{selectedCount !== 1 ? 's' : ''}. 
            Only check the fields you want to update.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Level Update */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateLevel"
                checked={updates.updateLevel}
                onCheckedChange={(checked) => 
                  setUpdates(prev => ({ ...prev, updateLevel: checked as boolean }))
                }
              />
              <Label htmlFor="updateLevel" className="font-medium">
                Update Level
              </Label>
            </div>
            {updates.updateLevel && (
              <Select
                value={updates.level || ''}
                onValueChange={(value) => 
                  setUpdates(prev => ({ ...prev, level: value as 'elementary' | 'junior-high' | 'senior-high' | 'college' }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="junior-high">Junior High</SelectItem>
                  <SelectItem value="senior-high">Senior High</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Department Update */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateDepartment"
                checked={updates.updateDepartment}
                onCheckedChange={(checked) => 
                  setUpdates(prev => ({ ...prev, updateDepartment: checked as boolean }))
                }
              />
              <Label htmlFor="updateDepartment" className="font-medium">
                Update Department
              </Label>
            </div>
            {updates.updateDepartment && (
              <Select
                value={updates.department || ''}
                onValueChange={(value) => 
                  setUpdates(prev => ({ ...prev, department: value }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CECE">CECE</SelectItem>
                  <SelectItem value="CBA">CBA</SelectItem>
                  <SelectItem value="CTELAN">CTELAN</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!updates.updateDepartment && !updates.updateLevel}
            >
              Update {selectedCount} Student{selectedCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;
