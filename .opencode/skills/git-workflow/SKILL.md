---
name: git-workflow
description: 自动完成 Git 提交和分支管理，包括生成规范的提交信息、暂存变更、提交代码、推送到远程仓库，以及回滚操作
---

# Git 工作流技能

你是一个 Git 操作专家。当用户要求提交代码、完成 Git 操作或回滚代码时，按以下流程执行。

## 触发条件

### 提交相关
当用户说"提交代码"、"push"、"commit"、"帮我提交"或类似意图时，执行提交流程。

### 回滚相关
当用户说"回滚"、"rollback"、"撤销"、"reset"、"还原"、"回到之前"或类似意图时，执行回滚流程。

## 提交流程

### 第一步：检查当前状态

首先运行以下命令了解当前仓库状态：

```bash
git status
git branch --show-current
git diff --stat
```

根据输出判断：
- 是否有未提交的更改
- 当前所在分支
- 更改的文件数量和统计信息

### 第二步：分支管理

根据用户需求处理分支：

```bash
# 如果用户指定创建新分支
git checkout -b <branch-name>

# 如果用户指定切换分支
git checkout <branch-name>

# 如果用户未指定，保持在当前分支
```

### 第三步：暂存变更

自动暂存所有更改：

```bash
git add .
```

### 第四步：生成提交信息

分析暂存的更改并生成符合约定式提交规范的提交信息：

```bash
git diff --staged
```

根据更改内容判断提交类型：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具变更

生成格式：
```
<type>(<scope>): <简短描述>

<正文：解释为什么做这个改动>
```

### 第五步：提交代码

```bash
git commit -m "<生成的提交信息>"
```

### 第六步：推送到远程

```bash
git push origin <当前分支名>
```

如果分支没有设置上游跟踪：

```bash
git push -u origin <当前分支名>
```

## 回滚流程

### 场景 A：回滚未提交的修改

**触发词**：`撤销修改`、`回滚更改`、`discard changes`

**执行步骤**：

1. 确认当前有未提交的更改
2. 向用户确认：
   ```
   将丢弃所有未提交的修改，已暂存的更改会先用 git stash 保存。
   确认执行？(y/n)
   ```
3. 如果用户确认，执行：
   ```bash
   git stash save "回滚前自动备份 - $(date +%Y%m%d_%H%M%S)"
   git checkout .
   ```
4. 提示用户：
   ```
   修改已丢弃。之前的更改已保存在 stash 中，
   可使用 git stash list 查看，git stash pop 恢复。
   ```

### 场景 B：回滚最后一次提交（未推送）

**触发词**：`撤销上次提交`、`undo last commit`

**执行步骤**：

1. 检查最后一次提交是否已推送：
   ```bash
   git status
   git log --oneline -1
   ```
2. 如果未推送，向用户确认：
   ```
   将撤销最后一次提交：<提交信息>
   选项：
   1. 保留更改内容（soft reset）
   2. 丢弃更改内容（hard reset）
   请选择 (1/2):
   ```
3. 根据用户选择执行：
   ```bash
   # 选项 1：保留更改
   git reset --soft HEAD~1
   
   # 选项 2：丢弃更改（需二次确认）
   # 确认："这将永久丢弃所有更改，确认？(y/n)"
   git reset --hard HEAD~1
   ```

### 场景 C：回滚最后一次提交（已推送）

**触发词**：`撤销上次提交`、`undo last commit`（检测到已推送）

**执行步骤**：

1. 检测到提交已推送到远程
2. 向用户确认：
   ```
   检测到上次提交已推送到远程。
   将创建一个新的提交来撤销上次的更改（使用 git revert）。
   确认执行？(y/n)
   ```
3. 如果用户确认，执行：
   ```bash
   git revert HEAD --no-edit
   ```
4. 提示用户：
   ```
   已创建撤销提交。如需推送到远程，请手动执行：
   git push origin <当前分支名>
   ```

### 场景 D：回滚到指定提交

**触发词**：`回到某个提交`、`回滚到指定版本`、`revert to commit`

**执行步骤**：

1. 询问用户要回滚到哪个提交：
   ```
   请提供提交的 hash 值或描述（支持模糊搜索）
   ```
2. 如果用户提供描述，使用 git log 搜索：
   ```bash
   git log --oneline --grep="<用户描述>"
   ```
3. 显示找到的提交信息：
   ```bash
   git show <commit-hash> --stat
   ```
4. 向用户确认：
   ```
   将回滚到提交：<commit-hash> - <提交信息>
   选项：
   1. 创建新提交撤销更改（git revert，安全，适用于共享分支）
   2. 直接重置到该提交（git reset，仅适用于本地分支）
   请选择 (1/2):
   ```
5. 根据用户选择执行：
   ```bash
   # 选项 1：安全回滚（推荐）
   git revert <commit-hash>..HEAD --no-edit
   
   # 选项 2：重置（需二次确认）
   # 确认："这将永久丢弃 <commit-hash> 之后的所有提交，确认？(y/n)"
   git reset --hard <commit-hash>
   ```

### 场景 E：恢复丢失的提交

**触发词**：`找回丢失的提交`、`恢复代码`、`找回代码`

**执行步骤**：

1. 使用 reflog 查找丢失的提交：
   ```bash
   git reflog
   ```
2. 显示最近的操作记录，帮助用户定位丢失的提交
3. 创建恢复分支：
   ```bash
   git checkout -b recovery/<描述> <commit-hash>
   ```
4. 提示用户：
   ```
   已创建恢复分支 recovery/<描述>。
   可以在此分支上检查代码，确认无误后合并到主分支。
   ```

## 错误处理

### 合并冲突

如果在回滚过程中遇到合并冲突：

```bash
# 显示冲突文件
git status

# 提示用户：
检测到合并冲突，请手动解决冲突后执行：
git add <冲突文件>
git revert --continue
```

### 没有远程仓库

```bash
# 检测远程仓库
git remote -v

# 如果没有远程仓库，提示用户：
未配置远程仓库。如需推送，请先添加远程仓库：
git remote add origin <远程仓库地址>
```

### 认证失败

```
Git 认证失败。请检查：
1. SSH 密钥是否配置（git config --list | grep ssh）
2. HTTPS 凭证是否正确
3. 是否有仓库访问权限

可使用以下命令配置：
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 没有可提交的更改

```
没有检测到需要提交的更改。
当前工作目录是干净的。
```

### 没有可回滚的内容

```
没有检测到可回滚的内容。
当前分支没有提交记录，或所有更改都已提交并推送。
```

## 安全规则

1. **永远不要在共享分支上强制推送**
   - 仅在个人分支使用 `git push --force-with-lease`
   - 共享分支（main、develop 等）禁止强制推送

2. **回滚前始终备份**
   - 使用 `git stash` 保存未提交的更改
   - 使用 `git branch backup/<时间戳>` 创建备份分支

3. **破坏性操作需二次确认**
   - `git reset --hard`
   - `git checkout .`
   - `git clean -fd`

4. **优先使用 revert 而非 reset**
   - 对于已推送的提交，使用 `git revert` 创建撤销提交
   - `git reset` 仅用于本地分支

5. **提供恢复指引**
   - 执行破坏性操作后，提示使用 `git reflog` 恢复
   - 告知用户 reflog 保留期限（默认 90 天）

## 约定式提交规范

提交信息格式：

```
<类型>(<范围>): <简短描述>

<正文：解释为什么做这个改动>

<脚注：关联 Issue、Breaking Change 等>
```

### 类型说明

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat(auth): 增加用户登录功能 |
| fix | 修复 bug | fix(api): 修复空指针异常 |
| docs | 文档更新 | docs(readme): 更新安装说明 |
| style | 代码格式 | style: 统一缩进风格 |
| refactor | 重构 | refactor(db): 优化查询逻辑 |
| test | 测试 | test: 增加单元测试覆盖 |
| chore | 构建/工具 | chore: 升级依赖版本 |
| revert | 回滚 | revert: 撤销 feat(auth) 提交 |

### 好的提交信息

```
feat(auth): 增加基于 TOTP 的双因素认证

用户反馈账户安全需求强烈（Issue #892），增加 TOTP 作为
可选的第二认证因素。选择 TOTP 而非 SMS 是因为不依赖
手机信号且更安全（SIM swap 攻击无效）。

Closes #892
```

### 坏的提交信息

```
❌ fix stuff
❌ update code
❌ WIP
❌ 修复 bug（哪个 bug？为什么会有这个 bug？）
```
