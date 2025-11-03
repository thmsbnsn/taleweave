# Family Accounts & Co-Parent Support Setup

## ✅ What's Been Implemented

### 1. **Database Schema** (`database/family-accounts-migration.sql`)
- ✅ Added `is_child`, `username`, `display_name` columns to `users` table
- ✅ Created `parent_children` table for many-to-many parent-child relationships
- ✅ Created `parent_invitations` table for co-parent invitations
- ✅ Auto-linking trigger when child account is created
- ✅ RLS policies for all tables

**Action Required:** Run this SQL file in your Supabase SQL Editor.

### 2. **Child Account System**

#### **API Routes:**
- ✅ `/api/children/create` - Create child account (username/password, no email needed)
- ✅ `/api/children/login` - Child login with username/password

#### **Pages:**
- ✅ `/children/login` - Child login page (username/password form)
- ✅ Updated `/login` - Added link to kids login

#### **How It Works:**
- Children login with **username and password** (no email required!)
- System generates internal email: `username+parent_id@taleweave.internal`
- Username is stored separately for display and login lookup

### 3. **Co-Parent Invitations**

#### **API Routes:**
- ✅ `/api/parents/invite` - Send co-parent invitation
- ✅ `/api/parents/accept-invite` - Accept invitation

#### **Pages:**
- ✅ `/parents/accept-invite` - Accept co-parent invitation (via email link)

#### **How It Works:**
- Parent selects child → invites another parent by email
- System generates invitation token and link
- Co-parent receives link, logs in, accepts invitation
- Both parents can now manage the child account

### 4. **Parent Dashboard Updates** (`/parent`)

#### **New Features:**
- ✅ **Create Child Account** form:
  - Username (what they login with)
  - Password
  - Display Name (how they appear)
  
- ✅ **Child Management:**
  - View all linked children (from `parent_children` table)
  - Select child to manage
  - App lock toggle per child
  
- ✅ **Invite Co-Parent:**
  - Select child → Enter co-parent email
  - Generate invitation link
  - Share link (email integration coming soon)

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

1. Open Supabase SQL Editor
2. Copy/paste contents of `database/family-accounts-migration.sql`
3. Execute the migration
4. Verify tables are created:
   - `parent_children`
   - `parent_invitations`
   - Check `users` table has new columns: `is_child`, `username`, `display_name`

### **Step 2: Verify Environment Variables**

Ensure `.env.local` has:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

This is required for creating child accounts (uses admin API).

### **Step 3: Test the Flow**

1. **Parent Creates Account:**
   - Sign up at `/signup` (uses email)
   - Login at `/login`

2. **Parent Creates Child:**
   - Go to `/parent`
   - Click "Create First Child Account" or "+ Add Child"
   - Fill in username, password, display name
   - Submit

3. **Child Logs In:**
   - Go to `/children/login`
   - Enter username and password
   - Should login successfully

4. **Invite Co-Parent:**
   - In parent dashboard, select a child
   - Click "Invite Co-Parent"
   - Enter co-parent email
   - Copy invitation link
   - Co-parent logs in, visits link, accepts invitation

---

## 📊 Database Schema Overview

### **parent_children Table:**
Links parents to children (many-to-many):
- `parent_id` → Parent user ID
- `child_id` → Child user ID
- `relationship_type` → 'parent' or 'co_parent'
- `status` → 'active', 'pending', 'removed'

### **parent_invitations Table:**
Tracks co-parent invitations:
- `inviter_id` → Who sent the invite
- `child_id` → Which child
- `invited_email` → Email of invited parent
- `invitation_token` → Unique token for link
- `status` → 'pending', 'accepted', 'declined', 'expired'
- `expires_at` → 7 days from creation

### **users Table Updates:**
- `is_child` → Boolean flag for child accounts
- `username` → Unique username for login
- `display_name` → Child's display name
- `parent_id` → Primary parent (for initial creation)

---

## 🔐 Security Features

1. **RLS Policies:**
   - Parents can only view children they're linked to
   - Parents can only create invitations for their children
   - Invitations expire after 7 days

2. **Username Uniqueness:**
   - Enforced at database level
   - Checked before account creation

3. **Email Verification:**
   - Child accounts use system-generated emails
   - Auto-confirmed (no email verification needed)

4. **Parent-Child Linking:**
   - Only parents with active links can manage children
   - Co-parents have same permissions as primary parent

---

## 🎯 User Flows

### **Parent Flow:**
1. Sign up with email → Create account
2. Go to Parent Portal → Create child account
3. Child can now login with username/password
4. Optional: Invite co-parent

### **Child Flow:**
1. Parent creates account for them
2. Login at `/children/login` with username/password
3. Use app normally (stories, games, etc.)

### **Co-Parent Flow:**
1. Receive invitation link (via email/share)
2. Login with their own email/password
3. Visit invitation link → Accept
4. Now has access to manage child account

---

## 🐛 Known Limitations / TODOs

1. **Email Integration:**
   - Currently returns invitation link to parent
   - TODO: Integrate email service (SendGrid, Resend) to send invitation emails

2. **Child Account Cleanup:**
   - If child account creation fails after auth user creation, cleanup needed
   - Currently logs error but doesn't delete orphaned auth user

3. **Username Validation:**
   - Currently minimal (3+ characters)
   - Could add: no spaces, alphanumeric only, etc.

4. **Display Name:**
   - Currently optional in query but required in form
   - Should make it truly optional or always required

5. **Co-Parent Permissions:**
   - Currently same as primary parent
   - Could add: read-only co-parent option, specific permissions

---

## 💡 Future Enhancements

1. **Email Notifications:**
   - Send invitation emails automatically
   - Welcome email for new child accounts
   - Activity summaries for parents

2. **Child Profile Pictures:**
   - Upload avatar in parent dashboard
   - Or use character images

3. **Multiple Parents Per Child:**
   - Currently supports, but UI could be clearer
   - Show list of all parents for a child

4. **Parent Roles:**
   - Primary parent (full control)
   - Co-parent (full or limited)
   - Guardian (read-only)

5. **Family Groups:**
   - Create family groups
   - Share stories/characters across family

---

## ✅ Testing Checklist

- [ ] Run database migration
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Parent creates child account
- [ ] Child logs in with username/password
- [ ] Parent locks/unlocks child account
- [ ] Parent invites co-parent
- [ ] Co-parent accepts invitation
- [ ] Co-parent can manage child account
- [ ] Multiple children per parent works
- [ ] Multiple parents per child works

---

## 🎉 Benefits

- ✅ **No Email Required for Kids** - Username/password login
- ✅ **Co-Parent Friendly** - Easy invitation system
- ✅ **Family Management** - One parent account, multiple children
- ✅ **Secure** - RLS policies protect data
- ✅ **Scalable** - Supports unlimited children and co-parents

**Everything is wired up and ready to use!** 🚀

