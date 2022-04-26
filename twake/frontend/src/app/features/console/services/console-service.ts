import Api from 'app/features/global/framework/api-service';
import DepreciatedCollections from 'app/deprecated/CollectionsV1/Collections/Collections';
import InitService from 'app/features/global/services/init-service';
import Languages from 'app/features/global/services/languages-service';
import { ToasterService as Toaster } from 'app/features/global/services/toaster-service';
import { ConsoleMemberRole } from 'app/features/console/types/types';
import Logger from 'app/features/global/framework/logger-service';
import { JWTDataType } from 'app/features/auth/jwt-storage-service';
import { getCompany } from 'app/features/companies/state/companies';

class ConsoleService {
  logger: Logger.Logger;
  constructor() {
    this.logger = Logger.getLogger('Console');
  }

  public getCompanyManagementUrl(companyId: string) {
    const identity_provider_id =
      getCompany(companyId)?.identity_provider_id || getCompany(companyId)?.id;
    console.log(identity_provider_id);
    return (
      InitService.server_infos?.configuration?.accounts?.console?.company_management_url || ''
    ).replace('{company_id}', identity_provider_id);
  }

  public getCompanyUsersManagementUrl(companyId: string) {
    const identity_provider_id =
      getCompany(companyId)?.identity_provider_id || getCompany(companyId)?.id;
    return (
      InitService.server_infos?.configuration?.accounts?.console?.collaborators_management_url || ''
    ).replace('{company_id}', identity_provider_id);
  }

  public verifyMail() {
    return new Promise(async resolve => {
      const response = await Api.post(
        '/internal/services/console/v1/resend-verification-email',
        {},
        (res: { data: { error: string; message: string; statusCode: number } }) => {
          if (res.data === null)
            return Toaster.success(
              Languages.t('services.console_services.toaster.success_verify_email'),
            );
          else return Toaster.error(res.data.message);
        },
      );

      return resolve(response);
    });
  }

  public async addMailsInWorkspace(data: {
    workspace_id: string;
    company_id: string;
    emails: string[];
    workspace_role?: 'moderator' | 'member';
    company_role?: ConsoleMemberRole;
  }) {
    const res: any = await Api.post(
      `/internal/services/workspaces/v1/companies/${data.company_id}/workspaces/${data.workspace_id}/users/invite`,
      {
        invitations: [
          ...data.emails.map(email => ({
            email,
            role: data.workspace_role || 'member',
            company_role: data.company_role || 'member',
          })),
        ],
      },
    );

    if (!res?.resources || !res.resources.length) {
      this.logger.error('Error while adding emails');
      return Toaster.error(Languages.t('services.console_services.toaster.add_emails_error'));
    }

    if (res.resources.filter((r: any) => r.status === 'error').length > 0) {
      res.resources
        .filter((r: any) => r.status === 'error')
        .forEach(({ email, message }: { email: string; message: string }) => {
          // possible error messages are
          // 1. "User already belonged to the company" (Good typo in it...)
          // 2. "Unable to invite user ${user.email} to company ${company.code}"
          this.logger.error('Error while adding email', email, message);

          Toaster.warning(
            Languages.t('services.console_services.toaster.add_email_error_message', [
              email + ` (${message})`,
            ]),
          );
        });
    }

    if (res.resources.filter((r: any) => r.status !== 'error').length > 0) {
      Toaster.success(
        Languages.t('services.console_services.toaster.success_invite_emails', [
          res.resources.filter((r: any) => r.status !== 'error').length,
        ]),
      );
    }

    return res;
  }

  /**
   * @deprecated use ConsoleServiceAPIClient.getNewAccessToken
   * @param currentToken
   * @param callback
   */
  public getNewAccessToken(
    currentToken: { access_token: string },
    callback: (err?: Error, access_token?: JWTDataType) => void,
  ): void {
    this.logger.debug(
      `getNewAccessToken, get new token from current token ${JSON.stringify(currentToken)}`,
    );
    Api.post(
      '/internal/services/console/v1/login',
      { remote_access_token: currentToken.access_token },
      (response: {
        access_token: JWTDataType;
        message: string;
        error: string;
        statusCode: number;
      }) => {
        if (response.statusCode && !response.access_token) {
          this.logger.error(
            'getNewAccessToken, Can not retrieve access_token from console. Response was',
            response,
          );
          callback(new Error('Can not retrieve access_token from console'));
          return;
        }
        // the input access_token is potentially expired and so the response contains an error.
        // we should be able to refresh the token or renew it in some way...

        callback(undefined, response.access_token);
      },
    );
  }
}

export default new ConsoleService();